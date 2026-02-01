export interface Id {
  $oid: string
}

export interface User {
  id: Id,
  name: string,
}

export interface Doc {
  _id: Id,
  author: User,
  collaborators: Id[],
  title: string,
  content: string,
  type: string,
  starred: boolean,
  last_update: string
}

export interface InsertUpdate{
    position:number,
    type:{
        update:"insert",
        data:string
    },
    timestamp:string
}

export interface DeleteUpdate{
    position:number,
    type:{
        update:"delete",
        length:number
    },
    timestamp:string
}

export interface LocationState{
  state:Doc
}

export interface CollabRequest{
  _id: Id,
  from:Id,
  doc:Id,
  timestamp:string
}

export interface CollabRequestHandler{
  action: "accept" | "reject",
  request: CollabRequest
}

export interface UploadedFile{
  _id: Id,
  owner: Id,
  content_type: string,
  filename:string,
  size: number
  data: number[]
}

export interface UploadedDoc{
  _id: Id,
  author: Id,
  content: string,
  title: string,
}


export function applyRemoteUpdate(
  content: string,
  update: InsertUpdate | DeleteUpdate
): string {
  const pos = update.position

  // Safety clamp
  if (pos < 0 || pos > content.length) {
    console.warn("Invalid update position", update)
    return content
  }

  if (update.type.update === "insert") {
    return (
      content.slice(0, pos) +
      update.type.data +
      content.slice(pos)
    )
  }

  if (update.type.update === "delete") {
    return (
      content.slice(0, pos) +
      content.slice(pos + update.type.length)
    )
  }

  return content
}