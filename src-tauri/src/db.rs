use mongodb::{
    bson::{doc, oid::ObjectId, DateTime},
    error::Error,
    Client,
    Database,
    options::ClientOptions,
    Collection,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    alias: String,
    email: String,
    password: String,
    full_name: String,
    created_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    user_id: ObjectId,
    content: String,
    created_at: DateTime,
    updated_at: DateTime,
}

pub async fn connect_to_db() -> Result<Database, Error> {
    let client_uri = std::env::var("MONGO_URI").expect("You must set environment variable: MONGO_URI");
    let client_options = ClientOptions::parse(&client_uri).await?;
    let client = Client::with_options(client_options)?;
    let db = client.database("ekilox");

    Ok(db)
}

async fn collection_exists(db: &Database, collection_name: &str) -> Result<bool, Error> {
    let collections = db.list_collection_names().await?;
    Ok(collections.contains(&collection_name.to_string()))
}

pub async fn ensure_collections_exist(db: &Database) -> Result<(), Error> {
    let users_collection_name = "users";
    let messages_collection_name = "messages";

    // Create collections if they don't exist
    if !collection_exists(db, users_collection_name).await? {
        db.create_collection(users_collection_name).await?;
        println!("Created collection: {}", users_collection_name);
    } else {
        println!("Collection already exists: {}", users_collection_name);
    }

    if !collection_exists(db, messages_collection_name).await? {
        db.create_collection(messages_collection_name).await?;
        println!("Created collection: {}", messages_collection_name);
    } else {
        println!("Collection already exists: {}", messages_collection_name);
    }

    // Initial users data
    let users = vec![
        User { 
            alias: "john_doe".to_string(), 
            email: "john.doe@example.com".to_string(), 
            password: "securepassword".to_string(),
            full_name: "John Doe".to_string(),
            created_at: DateTime::now(),
        },
        User { 
            alias: "jane_smith".to_string(), 
            email: "jane.smith@example.com".to_string(), 
            password: "anotherpassword".to_string(),
            full_name: "Jane Smith".to_string(),
            created_at: DateTime::now(),
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

    // Initial messages data linked to users
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

    let messages_collection: Collection<Message> = db.collection(messages_collection_name);
    messages_collection.insert_many(messages).await?;
    println!("Inserted messages");

    Ok(())
}
