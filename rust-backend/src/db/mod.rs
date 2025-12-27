use std::{env};
use futures::TryStreamExt;
use mongodb::{
    Client, Collection,
    bson::{self, DateTime, doc},
    error::Error,
};

use crate::models::{self, Doc, IntoObjectId};

pub struct Db {
    users: Collection<models::User>,
    docs: Collection<models::Doc>,
}


impl Db {
    pub async fn init() -> Self {
        let uri = env::var("MONGO_URI").unwrap();
        let client = Client::with_uri_str(uri).await.unwrap();
        let database = client.database("docsly");
        let users = database.collection::<models::User>("users");
        let docs = database.collection::<models::Doc>("docs");
        Db { users, docs }
    }
    // User Operation
    pub async fn create_user(&self, mut user: models::User) -> Result<(), Error> {
        if user.email=="a@a.com".to_string(){
            return Ok(())
        }
        user.doc_count = Some(0);
        let res = self.users.insert_one(user).await;
        match res {
            Ok(r) => {
                log::info!("{:?}", r);
                Ok(())
            }
            Err(e) => Err(e),
        }
    }
    ///Find user with id
    pub async fn find_user_with_id<T: IntoObjectId>(&self, id: &T) -> Result<models::User, String> {
        let res = self.users.find_one(doc! {"_id":id.into_objetc_id()}).await;
        match res {
            Ok(Some(u)) => Ok(u),
            Ok(None) => Err("User Not Found".to_string()),
            Err(e) => Err(e.to_string()),
        }
    }

    ///Find User with email and password
    pub async fn find_user(&self, user: models::LoginUser) -> Result<models::User, String> {
        let res = self
            .users
            .find_one(bson::doc! {
                "email":user.email,
            })
            .await;
        match res {
            Ok(Some(u)) => {
                if user.password == u.password {
                    Ok(u)
                } else {
                    Err("Incorrect Password".to_string())
                }
            }
            Ok(None) => Err("User not found".to_string()),
            Err(e) => Err(e.to_string()),
        }
    }
    //  Doc Collection
    ///Update Doc Count
    async fn update_count_of_doc(&self, doc: &models::Doc) -> Result<(), Error> {
        let res = self.users.update_one(
            doc! {
                "_id":doc.author.as_ref().unwrap().id
            },
            doc! {
                "$inc":{"doc_count": 1}
            }
        ).await;
        match res {
            Ok(_) => {
                Ok(())
            }
            Err(e) => Err(e)
        }
    }
    /// Create Doc
    pub async fn create_doc(&self, mut doc: models::Doc) -> Result<(), Error> {
        self.update_count_of_doc(&doc).await?;
        doc.last_update = Some(DateTime::now());
        let res = self.docs.insert_one(doc).await;
        match res {
            Ok(r) => {
                log::info!("{:?}", r);
                Ok(())
            }
            Err(e) => Err(e),
        }
    }
    /// Update Doc
    pub async fn update_doc<T: IntoObjectId>(&self,doc_id: &T, update: models::Update) {
        let id = doc_id.into_objetc_id();
        let res = self
            .docs
            .update_one(
                doc! {
                    "_id":id
                },
                doc! {
                    "$set":{
                        "content":update.update
                    }
                },
            )
            .await;
        match res {
            Ok(u) => {
                log::info!("{:?}", u);
            }
            Err(e) => {
                log::error!("{}", e.to_string());
            }
        }
    }

    pub async fn find_docs_with_user_id<T: IntoObjectId>(&self,user_id:T) -> Option<Vec<Doc>>{
        let user_id = user_id.into_objetc_id();
        let res = self.docs.find(doc! {"author.id":user_id}).await;
        match res {
            Ok(c) =>{
                Some(c.try_collect().await.unwrap())
            }
            Err(_) => {
                None
            }
        }
    }
}
