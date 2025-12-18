use std::{env, sync::Arc};

use mongodb::{
    Client, Collection,
    bson::{self, DateTime, doc},
    error::Error,
};

use crate::models::{self, IntoObjectId};

pub struct Db {
    users: Collection<models::User>,
    docs: Collection<models::Docs>,
}

impl Db {
    pub async fn init() -> Self {
        let uri = env::var("MONGO_URI").unwrap();
        let client = Client::with_uri_str(uri).await.unwrap();
        let database = client.database("docsly");
        let users = database.collection::<models::User>("users");
        let docs = database.collection::<models::Docs>("docs");
        Db { users, docs }
    }

    // User Operation
    pub async fn create_user(&self, mut user: models::User) -> Result<(), Error> {
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
    pub async fn find_user_with_id(&self, id: impl IntoObjectId) -> Result<models::User, String> {
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

    async fn update_count_of_doc(&self, doc: &models::Docs) -> Result<(), Error> {
        let res = self.users.update_one(
            doc! {
                "_id":doc.author
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

    pub async fn create_doc(&self, mut doc: models::Docs) -> Result<(), Error> {
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

    pub async fn update_doc(&self,doc_id: &String, update: models::Update) {
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
}
