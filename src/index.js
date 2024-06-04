import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import messageModel from './models/messages.js'
import indexRouter from './routes/indexRouter.js'
import initializePassport from './config/passport/passport.js'
import { Server } from 'socket.io'
import { engine } from 'express-handlebars'
import { __dirname } from './path.js'
import faker from 'faker'; // Importar Faker.js
import { addLogger } from './utils/logger.js'

//const app = express()
app.use(addLogger)

//Configuraciones o declaraciones
const app = express()
const PORT = 8000


// Server
const server = app.listen(PORT, () => {
    console.log(`Estoy corriendo en el puerto: ${PORT}`)
})

// Socket.io setup
const io = new Server(server)
//Connection DB
mongoose.connect(varenv.MONGO_BD_URL)
    .then(() => console.log("SI!!!, me conecte al Atlas"))
    .catch(e => console.log(e))

// Middleware
app.use(express.json())
app.use(cookieParser("claveSecreta"))
app.use(session({
    secret: varenv.SESSION_SECRET,
    resave: true,
    store: MongoStore.create({
        mongoUrl: varenv.MONGO_BD_URL,
        ttl: 60 * 60
    }),
    saveUninitialized: true
}))
app.use(cookieParser(varenv.COOKIE_SECRET))
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/views')

initializePassport()
app.use(passport.initialize())
app.use(passport.session())

// Generar productos simulados
const generateMockProducts = () => {
    const products = [];
    for (let i = 0; i < 100; i++) {
        const product = {
            title: faker.commerce.productName(),
            description: faker.lorem.sentences(),
            stock: faker.datatype.number({ min: 1, max: 100 }),
            category: faker.commerce.department(),
            status: true,
            code: faker.datatype.uuid(),
            price: faker.datatype.float({ min: 1, max: 1000, precision: 2 }),
            thumbnail: faker.image.imageUrl()
        };
        products.push(product);
    }
    return products;
}

// Routes
app.use('/', indexRouter)
app.get('/setCookie', (req, res) => {
    res.cookie('CookieCookie', 'Esto es una cookie :)', { maxAge: 3000000, signed: true }).send("Cookie creada")
})

app.get('/getCookie', (req, res) => {
    res.send(req.signedCookies)
})

app.get('/deleteCookie', (req, res) => {
    res.clearCookie('CookieCookie').send("Cookie eliminada")
    
})

//Session Routes
app.get('/session', (req, res) => {
    console.log(req.session)
    if (req.session.counter) {
        req.session.counter++
        res.send(`Sos el usuario N° ${req.session.counter} en ingresar a la pagina`)
    } else {
        req.session.counter = 1
        res.send("Sos el primer usuario que ingresa a la pagina")
    }
})

app.post('/login', (req, res) => {
    const { email, password } = req.body

    if (email == "admin@admin.com" && password == "1234") {
        req.session.email = email
        req.session.password = password


    }
    console.log(req.session)
    res.send("Login")
})
// Endpoint para productos simulados
app.get('/mockingproducts', (req, res) => {
    const mockProducts = generateMockProducts();
    res.json(mockProducts);
});


io.on('connection', (socket) => {
    console.log("Conexion con Socket.io")

    socket.on('mensaje', async (mensaje) => {
        try {
            await messageModel.create(mensaje)
            const mensajes = await messageModel.find()
            io.emit('mensajeLogs', mensajes)
        } catch (e) {
            io.emit('mensajeLogs', e)
        }

    })
})
