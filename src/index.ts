import express from "express";
import dotenv from "dotenv";
import { userRoute } from "./controller/user.route";
import { blogRoute } from "./controller/blog.route";

//import { prisma } from "./lib/prisma";  //inserting with prisma


dotenv.config();

const PORT = process.env.PORT;

if (!PORT) {
    console.error("PORT is not provided .");
    process.exit(1);
}

const app = express();
app.use(express.json());

app.use("/users", userRoute);
app.use("/blogs", blogRoute);


app.listen(Number(PORT), async () => {
    console.log(`✅ Express server running at http://localhost:${PORT}`);

    //await register(); //for insreting with prisma
});




//for insreting with prisma
// async function register() {
//     try {
//         const user = await prisma.user.create({
//             data: {
//                 firstname: "Dili",
//                 lastname: "Reba",
//                 email: "dilireba@gmail.com",
//                 password: "dilireba@26"
//             }
//         });

//         console.log(user);

//     } catch (error: unknown) {
//         if (error instanceof Error) {
//             console.error("Prisma Error:", error.message);
//         } else {
//             console.error("An unexpected error occurred:", error);
//         }
//     }
// }

