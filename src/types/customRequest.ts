import { Request } from "express";



interface CustomRequest extends Request {
  user?:{
    id?:string,
    version?:string
  }
};


export default CustomRequest;
export { CustomRequest };