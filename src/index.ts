import express from "express";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";

dotenv.config();

const PORT = process.env.PORT;

if (!PORT) {
    console.error("PORT is not provided in your .env file.");
    process.exit(1);
}

const app = express();
app.use(express.json());


async function register() {
    try {
        const user = await prisma.user.create({
            data: {
                firstname: "Dili",
                lastname: "Reba",
                email: "dilireba@example.com",
                password: "dilireba@26"
            }
        });

        console.log(user);

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Prisma Error:", error.message);
        } else {
            console.error("An unexpected error occurred:", error);
        }
    }
}


app.listen(Number(PORT), async () => {
    console.log(`✅ Express server running at http://localhost:${PORT}`);
    await register();
});

// type User = {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     password: string;
// };

// const filePath = path.join(process.cwd(), "user.json");

// const getUsers = (): User[] => {
//     if (!fs.existsSync(filePath)) {
//         fs.writeFileSync(filePath, JSON.stringify())
//     }
// }


// // register user
// app.post("/users", (req: any, res: any) => {
//     const { firstName, lastName, email, password } = req.body;

//     const newUser: User = {
//         id: uuidv4(),
//         firstName,
//         lastName,
//         email,
//         password,
//     };

//     User.push(newUser);

//     res.status(201).json({
//         success: true,
//         user: newUser,
//     });
// });


//get user
// app.get("/users", (req: any, res: any) => {
//     res.status(200).json(users);
// });

