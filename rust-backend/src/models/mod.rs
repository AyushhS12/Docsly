use axum::extract::ws::{self, Message};
use bson::Binary;
use chrono::Utc;
use mongodb::bson::{DateTime, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::{from_str, to_string};
use std::{collections::HashMap, fmt::Display, str::{self, FromStr}, sync::Arc};
use tokio::sync::{Mutex, mpsc::Sender};

pub trait IntoObjectId {
    fn into_objetc_id(&self) -> ObjectId;
}

impl IntoObjectId for String {
    fn into_objetc_id(&self) -> ObjectId {
        ObjectId::from_str(self).unwrap()
    }
}

impl IntoObjectId for ObjectId {
    fn into_objetc_id(&self) -> ObjectId {
        *self
    }
}

impl IntoObjectId for &str {
    fn into_objetc_id(&self) -> ObjectId {
        ObjectId::from_str(self).unwrap()
    }
}

impl IntoObjectId for Arc<&str> {
    fn into_objetc_id(&self) -> ObjectId {
        ObjectId::from_str(self).unwrap()
    }
}

pub type DocsMap = Arc<Mutex<HashMap<String, Vec<Client>>>>;
pub type BufferMap = Arc<Mutex<HashMap<String, Sender<Update>>>>;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct LoginUser {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    pub email: String,
    pub password: String,
    pub doc_count: Option<usize>,
}

impl Display for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nUser{{\n\tid: {} \n\tname: {}\n\temail: {}\n}}",
            self.id.to_owned().unwrap().to_hex(),
            self.name,
            self.email
        )
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Folder {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub children: Vec<ObjectId>,
    pub created_at: DateTime,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "lowercase")]
pub enum DocType {
    Blank,
    MeetingDocs,
    DataTable,
    Essay,
    Folder(Folder),
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Doc {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub author: Option<Author>,
    pub collaborators: Vec<ObjectId>,
    pub title: String,
    #[serde(default)]
    pub content: String,
    #[serde(rename = "type")]
    pub doc_type: DocType,
    #[serde(default)]
    pub starred: Option<bool>,
    pub last_update: Option<DateTime>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Author {
    pub id: Option<ObjectId>,
    pub name: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct UploadedDoc{
    #[serde(rename = "_id",skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub owner: ObjectId,
    pub filename: String,
    pub content_type: String,
    pub size: usize,
    pub data: Binary
}

impl UploadedDoc{
    pub fn new(owner: impl IntoObjectId, filename: String, content_type: String, size: usize, data: Binary) -> Self{
        Self { id: None, owner:owner.into_objetc_id(), filename, content_type, size, data }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "lowercase", tag = "update")]
pub enum UpdateType {
    Insert { data: String },
    Delete { length: usize },
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Update {
    pub position: usize,
    pub from: Option<ObjectId>,
    #[serde(rename = "type")]
    pub update_type: UpdateType,
    pub timestamp: Option<chrono::DateTime<Utc>>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CollabRequest {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub author:ObjectId,
    pub from: ObjectId,
    pub doc: ObjectId,
    pub timestamp: chrono::DateTime<Utc>,
}

impl CollabRequest {
    pub fn new(author: ObjectId,from: ObjectId, doc: ObjectId) -> Self {
        Self {
            id: None,
            author,
            from,
            doc,
            timestamp: DateTime::now().into(),
        }
    }
}

impl From<Update> for ws::Message {
    fn from(value: Update) -> Self {
        match to_string(&value) {
            Ok(data) => Message::text(data),
            Err(e) => {
                log::error!("{}", e);
                panic!("cannot convert to Message")
            }
        }
    }
}
impl From<ws::Message> for Update {
    fn from(value: ws::Message) -> Self {
        let data = from_str::<Update>(value.to_text().unwrap());
        match data {
            Ok(u) => u,
            Err(e) => {
                log::error!("{}", e);
                panic!("cannot convert to Message")
            }
        }
    }
}

pub struct Client {
    pub id: String,
    pub sender: Sender<Message>,
    pub author: bool,
}

impl Client {
    pub fn new(id: impl IntoObjectId, sender: Sender<Message>) -> Client {
        Client {
            id: id.into_objetc_id().to_hex(),
            sender,
            author: false,
        }
    }
}

macro_rules! impl_error {
    ($($t:ty), + $(,)?) => {
        $(
            impl From<$t> for Error{
                fn from(value: $t) -> Self {
                    Error { error: value.to_string() }
                }
            }
        )+
    };
}
#[derive(Debug)]
pub struct Error {
    pub error: String,
}

impl std::error::Error for Error {}

impl Error {
    pub fn new<T: ToString>(v: T) -> Self {
        Error {
            error: v.to_string(),
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.error)
    }
}

impl_error! {
    mongodb::error::Error,
    argon2::password_hash::Error,
    axum::Error,
    String,
    &str
}

// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    exp: u64,
}

impl Claims {
    pub fn new(sub: String, exp: u64) -> Self {
        Claims { sub, exp }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DocQuery {
    pub id: String,
}
