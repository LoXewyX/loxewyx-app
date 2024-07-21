use crate::fs::{get_config, set_config};
use bcrypt::{hash, verify, DEFAULT_COST};
use hex::encode;
use lazy_static::lazy_static;
use mongodb::{
    bson::{doc, oid::ObjectId, DateTime},
    error::Error as MongoError,
    options::ClientOptions,
    Client, Collection, Database,
};
use rand::Rng;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, error::Error, fmt};
use tauri::State;

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: u16,
    pub message: String,
}

impl ApiError {
    fn new(code: u16, message: &str) -> Self {
        ApiError {
            code,
            message: message.to_string(),
        }
    }

    fn to_map(&self) -> HashMap<&str, serde_json::Value> {
        let mut map = HashMap::new();
        map.insert("code", serde_json::json!(self.code));
        map.insert("message", serde_json::json!(self.message));
        map
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let map = self.to_map();
        write!(f, "{}", serde_json::to_string(&map).unwrap())
    }
}

impl Error for ApiError {}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    #[serde(skip_serializing_if = "Option::is_none")]
    _id: Option<ObjectId>,
    alias: String,
    email: String,
    password: String,
    full_name: String,
    created_at: DateTime,
    updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub(crate) user_id: ObjectId,
    pub(crate) content: String,
    pub(crate) created_at: DateTime,
    pub(crate) updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
struct Auth {
    user_id: ObjectId,
    code: String,
}

lazy_static! {
    static ref SHA_SALT: String =
        std::env::var("SHA_SALT").expect("You must set the environment variable: SHA_SALT");
}

fn hash_password(password: &str, alias: &str) -> Result<String, ApiError> {
    let salted_password = format!("{}{}{}", alias, password, *SHA_SALT);
    hash(salted_password, DEFAULT_COST)
        .map_err(|e| ApiError::new(500, &format!("Hashing error: {}", e)))
}

fn generate_random_hex(length: usize) -> String {
    let num_bytes = length / 2;
    let bytes: Vec<u8> = (0..num_bytes).map(|_| rand::thread_rng().gen()).collect();

    encode(bytes)
}

pub async fn connect_to_db() -> Result<Database, MongoError> {
    let client_uri =
        std::env::var("MONGO_URI").expect("You must set the environment variable: MONGO_URI");
    let client_options = ClientOptions::parse(&client_uri)
        .await
        .map_err(|e| MongoError::from(e))?;
    let client = Client::with_options(client_options).map_err(|e| MongoError::from(e))?;
    let db = client.database("ekilox");

    if let Err(err) = ensure_collections_exist_and_mock(&db).await {
        panic!("Failed to ensure collections exist: {}", err);
    }

    Ok(db)
}

async fn collection_exists(db: &Database, collection_name: &str) -> Result<bool, MongoError> {
    let collections = db
        .list_collection_names()
        .await
        .map_err(|e| MongoError::from(e))?;
    Ok(collections.contains(&collection_name.to_string()))
}

async fn ensure_collections_exist_and_mock(db: &Database) -> Result<(), MongoError> {
    let users_collection_name = "users";
    let messages_collection_name = "messages";
    let auths_collection_name = "auths";

    if !collection_exists(db, users_collection_name).await? {
        db.create_collection(users_collection_name)
            .await
            .map_err(|e| MongoError::from(e))?;

        let john_hashed_password = hash(
            format!("{}{}{}", "john_doe", "P4ssw0rd!", *SHA_SALT),
            DEFAULT_COST,
        )
        .expect("Error on hashing John Doe's password");
        let jane_hashed_password = hash(
            format!("{}{}{}", "jane_smith", "P4ssw0rd!", *SHA_SALT),
            DEFAULT_COST,
        )
        .expect("Error on hashing Jane Smith's password");

        let users = vec![
            User {
                _id: None,
                alias: "john_doe".to_string(),
                email: "john.doe@example.com".to_string(),
                password: john_hashed_password,
                full_name: "John Doe".to_string(),
                created_at: DateTime::now(),
                updated_at: DateTime::now(),
            },
            User {
                _id: None,
                alias: "jane_smith".to_string(),
                email: "jane.smith@example.com".to_string(),
                password: jane_hashed_password,
                full_name: "Jane Smith".to_string(),
                created_at: DateTime::now(),
                updated_at: DateTime::now(),
            },
        ];

        let users_collection: Collection<User> = db.collection(users_collection_name);
        let insert_result = users_collection
            .insert_many(users)
            .await
            .map_err(|e| MongoError::from(e))?;
        let user_ids: Vec<ObjectId> = insert_result
            .inserted_ids
            .values()
            .filter_map(|id| match id {
                mongodb::bson::Bson::ObjectId(oid) => Some(*oid),
                _ => None,
            })
            .collect();

        println!("Inserted mocked users with IDs: {:?}", user_ids);

        if !user_ids.is_empty() {
            if !collection_exists(db, messages_collection_name).await? {
                db.create_collection(messages_collection_name)
                    .await
                    .map_err(|e| MongoError::from(e))?;
                println!("Created collection: {}", messages_collection_name);

                let messages = vec![
                    Message {
                        user_id: user_ids[0],
                        content: "Hello, this is John!".to_string(),
                        created_at: DateTime::now(),
                        updated_at: DateTime::now(),
                    },
                    Message {
                        user_id: user_ids[0],
                        content: "How are you?".to_string(),
                        created_at: DateTime::now(),
                        updated_at: DateTime::now(),
                    },
                    Message {
                        user_id: user_ids[1],
                        content: "Hi, this is Jane!".to_string(),
                        created_at: DateTime::now(),
                        updated_at: DateTime::now(),
                    },
                ];

                let messages_collection: Collection<Message> =
                    db.collection(messages_collection_name);
                messages_collection
                    .insert_many(messages)
                    .await
                    .map_err(|e| MongoError::from(e))?;
                println!("Inserted messages");

                if !collection_exists(db, auths_collection_name).await? {
                    db.create_collection(auths_collection_name)
                        .await
                        .map_err(|e| MongoError::from(e))?;
                    println!("Created collection: {}", auths_collection_name);

                    let auths = vec![
                        Auth {
                            user_id: user_ids[0],
                            code: generate_random_hex(32),
                        },
                        Auth {
                            user_id: user_ids[1],
                            code: generate_random_hex(32),
                        },
                    ];

                    let auths_collection: Collection<Auth> = db.collection(auths_collection_name);
                    auths_collection
                        .insert_many(auths)
                        .await
                        .map_err(|e| MongoError::from(e))?;
                    println!("Inserted auths");
                }
            }
        }
    }

    Ok(())
}

pub async fn db_integrity(db: &Database) {
    if let Err(err) = ensure_collections_exist_and_mock(&db).await {
        panic!("Failed to ensure collections exist: {}", err);
    }
    println!("Collections are ensured to exist.");
}

#[tauri::command]
pub async fn create_user(
    state: State<'_, super::AppState>,
    alias: String,
    email: String,
    full_name: String,
    password: String,
) -> Result<User, ApiError> {
    let db = &state.db;
    let users_collection: Collection<User> = db.collection("users");

    let filter = doc! {
        "$or": [
            { "alias": &alias },
            { "email": &email }
        ]
    };

    let existing_user = users_collection
        .find_one(filter)
        .await
        .map_err(|e| ApiError::new(500, &format!("Failed to query MongoDB: {}", e)))?;

    if let Some(user) = existing_user {
        if user.alias == alias {
            return Err(ApiError::new(
                409,
                "A user with this username already exists",
            ));
        }
        if user.email == email {
            return Err(ApiError::new(409, "A user with this email already exists"));
        }
    }

    if password.len() < 8 {
        return Err(ApiError::new(
            400,
            "Password must be at least 8 characters long",
        ));
    }
    if !Regex::new(r"[A-Z]").unwrap().is_match(&password) {
        return Err(ApiError::new(
            400,
            "Password must contain at least one uppercase letter",
        ));
    }
    if !Regex::new(r"[a-z]").unwrap().is_match(&password) {
        return Err(ApiError::new(
            400,
            "Password must contain at least one lowercase letter",
        ));
    }
    if !Regex::new(r"\d").unwrap().is_match(&password) {
        return Err(ApiError::new(
            400,
            "Password must contain at least one digit",
        ));
    }
    if !Regex::new("[!@#$%^&*(),.?\"':{}|<>-\\\\\\/_+-]|`=")
        .unwrap()
        .is_match(&password)
    {
        return Err(ApiError::new(
            400,
            "Password must contain at least one special character",
        ));
    }

    let user = User {
        _id: None,
        alias: alias.clone(),
        email,
        full_name,
        password: hash_password(&password, &alias)?,
        created_at: DateTime::now(),
        updated_at: DateTime::now(),
    };

    let insert_result = users_collection
        .insert_one(&user)
        .await
        .map_err(|e| ApiError::new(500, &format!("Failed to insert user into MongoDB: {}", e)))?;

    if let Some(_id) = insert_result.inserted_id.as_object_id() {
        Ok(user)
    } else {
        Err(ApiError::new(500, "Failed to retrieve inserted ID"))
    }
}

#[tauri::command]
pub async fn authenticate_user(
    state: State<'_, super::AppState>,
    identifier: String,
    password: String,
) -> Result<User, ApiError> {
    let db = &state.db;
    let users_collection: Collection<User> = db.collection("users");
    let auth_collection: Collection<Auth> = db.collection("auths");

    let filter = doc! {
        "$or": [
            { "alias": &identifier },
            { "email": &identifier }
        ]
    };

    let user = users_collection
        .find_one(filter)
        .await
        .map_err(|e| ApiError::new(500, &format!("Failed to query MongoDB: {}", e)))?;

    if let Some(user) = user {
        let salted_password = format!("{}{}{}", user.alias, password, *SHA_SALT);
        if verify(salted_password, &user.password)
            .map_err(|e| ApiError::new(500, &format!("Hash verification error: {}", e)))?
        {
            let auth = Auth {
                user_id: user._id.expect("User ID should be present"),
                code: generate_random_hex(32),
            };

            auth_collection.insert_one(&auth).await.map_err(|e| {
                ApiError::new(
                    500,
                    &format!("Failed to insert access token into MongoDB: {}", e),
                )
            })?;

            set_config(
                "identifier".to_string(),
                Value::String(user._id.expect("User ID should be present").to_string()),
            );
            set_config("access_token".to_string(), Value::String(auth.code));
            Ok(user)
        } else {
            Err(ApiError::new(404, "Username, email, or password not found"))
        }
    } else {
        Err(ApiError::new(404, "Username, email, or password not found"))
    }
}

#[tauri::command]
pub async fn verify_user_by_code(state: State<'_, super::AppState>) -> Result<User, ApiError> {
    verify_user_by_code_db(&state.db).await
}

async fn verify_user_by_code_db(db: &Database) -> Result<User, ApiError> {
    let auth_collection: Collection<Auth> = db.collection("auths");
    let users_collection: Collection<User> = db.collection("users");

    let identifier = get_config("identifier")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| ApiError::new(400, "Missing identifier in configuration"))?;

    let access_token = get_config("access_token")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .ok_or_else(|| ApiError::new(400, "Missing access token in configuration"))?;

    let user_id = ObjectId::parse_str(&identifier)
        .map_err(|e| ApiError::new(400, &format!("Invalid user ID format: {}", e)))?;

    let auth_filter = doc! {
        "user_id": user_id,
        "code": access_token,
    };

    let auth = auth_collection
        .find_one(auth_filter)
        .await
        .map_err(|e| ApiError::new(500, &format!("Failed to query MongoDB: {}", e)))?;

    if let Some(_) = auth {
        let user_filter = doc! {
            "_id": user_id
        };

        let user = users_collection
            .find_one(user_filter)
            .await
            .map_err(|e| ApiError::new(500, &format!("Failed to query MongoDB: {}", e)))?;

        if let Some(user) = user {
            Ok(user)
        } else {
            Err(ApiError::new(404, "User not found"))
        }
    } else {
        Err(ApiError::new(404, "Invalid code or user ID"))
    }
}

#[tauri::command]
pub async fn logout_user(state: State<'_, super::AppState>) -> Result<(), ApiError> {
    match verify_user_by_code(state).await {
        Ok(_) => {
            set_config("identifier".to_string(), Value::String("".to_string()));
            set_config("access_token".to_string(), Value::String("".to_string()));

            Ok(())
        }
        Err(e) => Err(ApiError::new(401, &format!("Logout failed: {}", e))),
    }
}

#[tauri::command]
pub async fn get_all_messages(state: State<'_, super::AppState>) -> Result<Vec<Message>, ApiError> {
    let db = &state.db;
    let messages_collection: Collection<Message> = db.collection("messages");

    let mut cursor = messages_collection
        .find(doc! {})
        .await
        .map_err(|_| ApiError::new(500, "Error finding messages"))?;

    let mut messages: Vec<Message> = Vec::new();
    while cursor
        .advance()
        .await
        .map_err(|_| ApiError::new(500, "Error advancing cursor"))?
    {
        let message = cursor
            .deserialize_current()
            .map_err(|_| ApiError::new(500, "Error deserializing message"))?;
        messages.push(message);
    }

    Ok(messages)
}

#[tauri::command]
pub async fn get_users_by_message_ids(
    state: State<'_, super::AppState>,
    message_ids: Vec<ObjectId>,
) -> Result<HashMap<String, String>, ApiError> {
    let db = &state.db;
    let users_collection: Collection<User> = db.collection("users");

    let filter = doc! { "_id": { "$in": message_ids } };

    let mut cursor = users_collection
        .find(filter)
        .await
        .map_err(|_| ApiError::new(500, "Error finding users"))?;

    let mut user_map: HashMap<String, String> = HashMap::new();
    while cursor
        .advance()
        .await
        .map_err(|_| ApiError::new(500, "Error advancing cursor"))?
    {
        let user = cursor
            .deserialize_current()
            .map_err(|_| ApiError::new(500, "Error deserializing user"))?;
        user_map.insert(user._id.unwrap().to_hex(), user.alias);
    }

    Ok(user_map)
}

pub async fn send_message(
    db: &Database,
    text: String,
) -> Result<Message, ApiError> {
    let messages_collection: Collection<Message> = db.collection("messages");

    let user = verify_user_by_code_db(db).await.map_err(|e| {
        ApiError::new(401, &format!("Authentication failed: {}", e))
    })?;

    if text.trim().is_empty() {
        return Err(ApiError::new(400, "Message text cannot be empty"));
    }

    let message = Message {
        user_id: user._id.expect("User ID should be present"),
        content: text,
        created_at: DateTime::now(),
        updated_at: DateTime::now(),
    };

    messages_collection
        .insert_one(&message)
        .await
        .map_err(|e| ApiError::new(500, &format!("Failed to insert message into MongoDB: {}", e)))?;

    Ok(message)
}