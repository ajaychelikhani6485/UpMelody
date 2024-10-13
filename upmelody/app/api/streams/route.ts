import { NextRequest, NextResponse } from "next/server";
import {z} from "zod";
import {prismaClient} from "@/app/lib/db";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
var YT_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;
const CreateStremSchema=z.object({
    creatorId: z.string(),
    url: z.string()
})
export async function POST(req: NextRequest){
    try{
        const data=CreateStremSchema.parse(await req.json());
        const isYt=data.url.match(YT_REGEX);
        if(!isYt){
            return NextResponse.json({
                message: "Wrong URL format"
            },{
                status: 411
            });
        }
        const extractedId=data.url.split("?v=")[1];
        const res=await youtubesearchapi.GetVideoDetails(extractedId);
        console.log(res.title);
        console.log(res.thumbnail.thumbnails);
        const thumbnails=res.thumbnail.thumbnails;
        thumbnails.sort((a:{width:number},b:{width:number})=>a.width<b.width?-1:1)
        const stream = await prismaClient.stream.create({
            data:{
                userId:data.creatorId,
                url:data.url,
                extractedId:extractedId,
                type:"Youtube",
                title : res.title ?? "Can find video",
                smallImg:(thumbnails.length>1?thumbnails[thumbnails.length-2].url:thumbnails[thumbnails.length-1].url)??"https://t4.ftcdn.net/jpg/00/97/58/97/360_F_97589769_t45CqXyzjz0KXwoBZT9PRaWGHRk5hQqQ.jpg",
                bigImg:thumbnails[thumbnails.length-1].url??"https://t4.ftcdn.net/jpg/00/97/58/97/360_F_97589769_t45CqXyzjz0KXwoBZT9PRaWGHRk5hQqQ.jpg"
            }
        });
        return NextResponse.json({
            message:"Added stream",
            id: stream.id
        })
    } catch(e){
        console.log(e);
        return NextResponse.json({
            message: "Error while adding a stream"
        },{
            status:411
        });
    }
}
export async function GET(req: NextRequest){
    const creatorId=req.nextUrl.searchParams.get("creatorId");
    const streams=await prismaClient.stream.findMany({
        where:{
            userId:creatorId??""
        }
    })
    return NextResponse.json({
        streams
    })
}

