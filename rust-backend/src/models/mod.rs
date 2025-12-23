use std::{collections::HashMap, fmt::Display, str::FromStr, sync::Arc};
use axum::extract::ws::{Message};
use mongodb::bson::{DateTime, oid::ObjectId};
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, mpsc::Sender};

pub trait IntoObjectId {
    fn into_objetc_id(&self) -> ObjectId;
}

impl IntoObjectId for String{
    fn into_objetc_id(&self) -> ObjectId {
        ObjectId::from_str(self).unwrap()
    }
}

impl IntoObjectId for ObjectId{
    fn into_objetc_id(&self) -> ObjectId {
        *self
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct LoginUser{
    pub email:String,
    pub password:String
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct User {
    #[serde(rename = "_id",skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    pub email: String,
    pub password: String,
    pub doc_count: Option<usize>
}

impl Display for User{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f,"\nUser{{\n\tid: {} \n\tname: {}\n\temail: {}\n}}",self.id.to_owned().unwrap().to_hex(),self.name,self.email)
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Docs{
    #[serde(rename = "_id",skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub author: Option<ObjectId>,
    pub colaborators:Option<ObjectId>,
    pub title: String,
    pub content: String,
    pub starred: Option<bool>,
    pub last_update: Option<DateTime>
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Update{
    pub from:ObjectId,
    pub update:String
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(tag = "type", content = "data", rename_all="lowercase")]
pub enum WsEvents {
    Insert(Update),
    Delete(Update),
}

// impl Display for WsEvents{
//     fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
//         match Self {
//             Self::Delete(d) =>{
                
//             }
//         }
//         write!(f,"Message : {{\n type: {},\ndata: {}\n }}",Self::Delete())
//     }
// }

pub type ClientsMap = Arc<Mutex<HashMap<String, Client>>>;

pub struct Client{
    pub sender: Sender<Message>,
}

impl Client{
    pub fn new(sender: Sender<Message>) -> Client{
        Client{
            sender,
        }
    }
}

#[derive(Clone)]
pub struct DocState{
    pub author:ObjectId,
    pub users:Vec<String>,
}
pub type DocStateMap = Arc<Mutex<HashMap<String, DocState>>>;

impl DocState{
    pub fn new(author:ObjectId, ref mut users:Vec<String>) -> DocState{
        DocState{
            author,
            users:users.to_vec()
        }
    }
}

// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    exp: u64,
}

impl Claims{
    pub fn new(sub: String, exp : u64) -> Self{
        Claims { sub , exp }
    }
}