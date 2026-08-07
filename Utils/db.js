import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
dotenv.config();

console.log({
    DATABASE: process.env.DATABASE,
    USER: process.env.USER,
    PASSWORD: process.env.PASSWORD,
    // HOST: process.env.HOST
    HOST: process.env.HOST || "postgres"
});

//

const connectDB = () => {
    const sequelize = new Sequelize(
        process.env.DATABASE,
        'postgres',
        process.env.PASSWORD,
        {
            host: process.env.HOST || "postgres",
            port: 5432,
            dialect: 'postgres',

            // dialectOptions: {

            // },
            logging: console.log,

        },
    );

    sequelize.authenticate()


        .then(() => {

            console.log('Database Connection has been established successfully.');
            return sequelize;
        })
        .catch((error) => {
            console.log(error.message);
            setTimeout(connectDB, 5000);
        });

    return sequelize;
};

export default connectDB;
