import { getServerSession } from "next-auth";
import { NextAuthOptions ,User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import GoogleProvider from  'next-auth/providers/google';
import  jsonwebtoken  from "jsonwebtoken";
import { JWT } from 'next-auth/jwt';
import { SessionInterface, UserProfile} from "@/common.types";
import { createUser, getUser } from "./action";

export const authOptions: NextAuthOptions = {
    providers:[
        GoogleProvider({
            clientId:'500093838531-e9in7pa1jsqvbgn6kv5jj65e6igdab7k.apps.googleusercontent.com' || '',
            clientSecret:'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' || ''
        })
    ],
    jwt:{
        encode:({secret,token}) =>{
          const encodedToken = 
          jsonwebtoken.sign({
            ...token,
            iss:'grafbase',
            exp: Math.floor(Date.now() / 1000) + 60 * 60

          },secret)
          return encodedToken;
        },
        decode: async({secret,token})=>{
          const decodeToken=jsonwebtoken.verify(token!,secret) as JWT ;
         return decodeToken;
        }
    },
    theme:{
        colorScheme:'light',
        logo:'/logo.png'
    },
    callbacks: {
        async session({session}){
            const email = session?.user?.email as string;
            try{
                const data = await getUser(email) as { user? : UserProfile}
                const newSession = {
                    ...session,
                    user :{
                        ...session.user,
                        ...data?.user
                    }
                }
                return newSession
            } catch(error){
                console.log('Error retrieving user data', error)
                return session
            }
        },

        async signIn({user}:{ user:AdapterUser | User }){

         try{
         const userExsists = await getUser(user?.email as string) as { user?:UserProfile }

         if(!userExsists.user){
           await createUser (
            user.name as string ,
            user.email as string,
            user.image as string
            )
         }
          return true
         }catch(error:any){
           console.log(error)
           return false;
         }

        }
    }
}

export async function getCurrentUser(){
    const session = await getServerSession(authOptions) as SessionInterface;
    return session;
}