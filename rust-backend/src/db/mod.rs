use bson::DateTime;
use futures::TryStreamExt;
use mongodb::{
    Client, Collection,
    bson::{self, doc},
    results::UpdateResult,
};
use std::env;

use crate::{
    models::{self, Doc, Error, IntoObjectId, LoginUser, Update, UpdateType},
    utils::{hash_password, verify_password_hash},
};

pub struct Db {
    users: Collection<models::User>,
    docs: Collection<models::Doc>,
    changes: Collection<models::Update>,
}

impl Db {
    pub async fn init() -> Self {
        let uri = env::var("MONGO_URI").unwrap();
        let client = Client::with_uri_str(uri).await.unwrap();
        let database = client.database("docsly");
        let users = database.collection::<models::User>("users");
        let docs = database.collection::<models::Doc>("docs");
        let changes = database.collection::<models::Update>("changes");
        Db {
            users,
            docs,
            changes,
        }
    }

    // User Operation

    ///Create user
    pub async fn create_user(&self, mut user: models::User) -> Result<(), models::Error> {
        if user.email == "a@a.com".to_string() {
            return Ok(());
        }
        let hashed_password = hash_password(user.password.as_bytes())?;
        user.password = hashed_password;
        user.doc_count = Some(0);
        let res = self.users.insert_one(user).await;
        match res {
            Ok(r) => {
                log::info!("{:?}", r);
                Ok(())
            }
            Err(e) => Err(e.into()),
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
    pub async fn find_user(&self, user: &models::LoginUser) -> Result<models::User, String> {
        let res = self
            .users
            .find_one(bson::doc! {
                "email":&user.email,
            })
            .await;
        match res {
            Ok(Some(u)) => Ok(u),
            Ok(None) => Err("User not found".to_string()),
            Err(e) => Err(e.to_string()),
        }
    }

    //  Doc Collection

    pub async fn find_doc_with_id(&self, id: impl IntoObjectId) -> Result<Doc, Error> {
        let doc_id = id.into_objetc_id();
        let res = self.docs.find_one(doc! {"_id":doc_id}).await;
        match res {
            Ok(Some(d)) => Ok(d),
            Ok(None) => Err(Error::from("doc not found")),
            Err(e) => Err(e.into()),
        }
    }

    ///Update Doc Count
    async fn update_count_of_doc(&self, doc: &models::Doc) -> Result<(), Error> {
        let res = self
            .users
            .update_one(
                doc! {
                    "_id":doc.author.as_ref().unwrap().id
                },
                doc! {
                    "$inc":{"doc_count": 1}
                },
            )
            .await;
        match res {
            Ok(_) => Ok(()),
            Err(e) => Err(e.into()),
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
            Err(e) => Err(e.into()),
        }
    }
    /// Update Doc
    // pub async fn update_doc<T: IntoObjectId>(&self,doc_id: &T, update: models::Update) {
    //     let id = doc_id.into_objetc_id();
    //     let res = self
    //         .docs
    //         .update_one(
    //             doc! {
    //                 "_id":id
    //             },
    //             doc! {
    //                 "$set":{
    //                     "content":update.update_type
    //                 }
    //             },
    //         )
    //         .await;
    //     match res {
    //         Ok(u) => {
    //             log::info!("{:?}", u);
    //         }
    //         Err(e) => {
    //             log::error!("{}", e.to_string());
    //         }
    //     }
    // }

    /// Login
    pub async fn verify_user(&self, user: LoginUser) -> Result<(), Error> {
        let res = self.users.find_one(doc! {"email":user.email}).await;
        match res {
            Ok(Some(u)) => {
                let pass = u.password;
                Ok(verify_password_hash(&user.password, &pass)?)
            }
            Ok(None) => Err(Error::from("user does not exist")),
            Err(e) => Err(e.into()),
        }
    }

    pub async fn find_docs_with_user_id<T: IntoObjectId>(&self, user_id: T) -> Option<Vec<Doc>> {
        let user_id = user_id.into_objetc_id();
        let res = self.docs.find(doc! {"author.id":user_id}).await;
        match res {
            Ok(c) => Some(c.try_collect().await.unwrap()),
            Err(_) => None,
        }
    }

    ///Handle Updates
    pub async fn handle_update<T: IntoObjectId>(
        &self,
        doc_id: T,
        update: Update,
    ) -> Result<UpdateResult, Error> {
        //
        // let doc_id = doc_id.into_objetc_id();
        // let (data_send, mut data_recv) = channel::<char>(256);
        // tokio::spawn(async move {
        //     let doc = doc_id.clone();
        //     while let Some(data) = data_recv.recv().await {
        //         self.docs.update_one(doc! {"_id":doc_id.into_objetc_id()}, doc! {
        //             "":""
        //         }).await;
        //     }
        // });
        //

        match update.update_type {
            UpdateType::Insert { ref data } => {
                match self
                    .docs
                    .find_one(doc! {"_id":doc_id.into_objetc_id()})
                    .await
                {
                    Ok(Some(doc)) => {
                        let old_data = doc.content;
                        let new_data = if update.position == 0{
                            data.to_owned() +  &old_data
                        } else {
                            old_data[..update.position].to_owned() + data + &old_data[update.position-1..]
                        };
                        match self
                            .docs
                            .update_one(
                                doc! {"_id":doc_id.into_objetc_id()},
                                doc! {
                                    "$set":{
                                        "content":new_data,
                                        "last_update":DateTime::now()
                                    }
                                },
                            )
                            .await
                        {
                            Ok(r) => match self.changes.insert_one(update).await {
                                Ok(_) => Ok(r),
                                Err(e) => Err(e.into()),
                            },
                            Err(e) => Err(e.into()),
                        }
                    }
                    Ok(None) => Err(Error::from("doc not found")),
                    Err(e) => Err(e.into()),
                }
            }
            UpdateType::Delete { length } => {
                let doc = self
                    .docs
                    .find_one(doc! {"_id":doc_id.into_objetc_id()})
                    .await;
                match doc {
                    Ok(Some(document)) => {
                        let pos = update.position;
                        let new_data = document.content[..pos].to_owned() + &document.content[(pos+length)..];
                        let res = self
                            .docs
                            .update_one(
                                doc! {"_id":document.id},
                                doc! {
                                    "$set":{
                                        "content":new_data
                                    }
                                },
                            )
                            .await;
                        match res {
                            Ok(i) => Ok(i),
                            Err(e) => Err(e.into()),
                        }
                    }
                    Ok(None) => Err(Error::new("document not found")),
                    Err(e) => {
                        log::error!("{}", e);
                        Err(e.into())
                    }
                }
            }
        }
    }
}
