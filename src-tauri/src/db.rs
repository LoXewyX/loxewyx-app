use std::{error::Error, fmt};
use mongodb::{
    bson::{doc, oid::ObjectId, DateTime},
    error::Error as MongoError,
    options::ClientOptions,
    Client, Collection, Database,
};
use serde::{Deserialize, Serialize};

#[derive(Debug)]
pub struct MyError {
    message: String,
}

impl MyError {
    fn new(message: &str) -> MyError {
        MyError {
            message: message.to_string(),
        }
    }
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl Error for MyError {}


#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(skip_serializing_if = "Option::is_none")]
    _id: Option<ObjectId>,
    alias: String,
    email: String,
    password: String,
    full_name: String,
    created_at: DateTime,
    updated_at: DateTime,
    access_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    user_id: ObjectId,
    content: String,
    created_at: DateTime,
    updated_at: DateTime,
}

pub async fn connect_to_db() -> Result<Database, MongoError> {
    let client_uri =
        std::env::var("MONGO_URI").expect("You must set the environment variable: MONGO_URI");
    let client_options = ClientOptions::parse(&client_uri).await?;
    let client = Client::with_options(client_options)?;
    let db = client.database("ekilox");

    Ok(db)
}

async fn collection_exists(db: &Database, collection_name: &str) -> Result<bool, MongoError> {
    let collections = db.list_collection_names().await?;
    Ok(collections.contains(&collection_name.to_string()))
}

pub async fn ensure_collections_exist(db: &Database) -> Result<(), MongoError> {
    let users_collection_name = "users";
    let messages_collection_name = "messages";

    if !collection_exists(db, users_collection_name).await? {
        db.create_collection(users_collection_name).await?;
        println!("Created collection: {}", users_collection_name);

        let users = vec![
            User {
                _id: None,
                alias: "john_doe".to_string(),
                email: "john.doe@example.com".to_string(),
                password: "securepassword".to_string(),
                full_name: "John Doe".to_string(),
                created_at: DateTime::now(),
                updated_at: DateTime::now(),
                access_token: String::new(),
            },
            User {
                _id: None,
                alias: "jane_smith".to_string(),
                email: "jane.smith@example.com".to_string(),
                password: "anotherpassword".to_string(),
                full_name: "Jane Smith".to_string(),
                created_at: DateTime::now(),
                updated_at: DateTime::now(),
                access_token: String::new(),
            },
        ];

        let users_collection: Collection<User> = db.collection(users_collection_name);
        let insert_result = users_collection.insert_many(users).await?;
        let user_ids: Vec<ObjectId> = insert_result
            .inserted_ids
            .values()
            .filter_map(|id| match id {
                mongodb::bson::Bson::ObjectId(oid) => Some(*oid),
                _ => None,
            })
            .collect();

        println!("Inserted users with IDs: {:?}", user_ids);

        if !user_ids.is_empty() {
            if !collection_exists(db, messages_collection_name).await? {
                db.create_collection(messages_collection_name).await?;
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
                messages_collection.insert_many(messages).await?;
                println!("Inserted messages");
            } else {
                println!("Collection already exists: {}", messages_collection_name);
            }
        }
    } else {
        println!("Collection already exists: {}", users_collection_name);
    }

    Ok(())
}

pub async fn add_user(
    db: &Database,
    alias: String,
    email: String,
    full_name: String,
    password: String,
) -> Result<(), MyError> {
    let user = User {
        _id: None,
        alias,
        email,
        full_name,
        password,
        created_at: DateTime::now(),
        updated_at: DateTime::now(),
        access_token: String::new(),
    };

    let users_collection: Collection<User> = db.collection("users");

    let insert_result = users_collection.insert_one(&user).await.map_err(|e| {
        MyError::new(&format!("Failed to insert user into MongoDB: {}", e))
    })?;

    if let Some(id) = insert_result.inserted_id.as_object_id() {
        println!("Inserted user ID: {:?}", id);
        Ok(())
    } else {
        Err(MyError::new("Failed to retrieve inserted ID"))
    }
}