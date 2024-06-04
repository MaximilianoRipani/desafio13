import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({

    dervice: 'gmail',
    auth: {
        user: "ripanipk1@gmail.com",
        pass: ""
    }
})

export const sendEmailChangePassword = async (email, linkChangrPassword) => {
    const mailOption = {
        from: "ripanipk1@gmail.com",
        to: email,
        subject: "Recuperacion de email",
        
        html:
        `
        <p>Haz click aqui para cambiar tu Password: </p> <button> <a href=${linkChangrPassword}>cambiar contraseña</a></button>
        `
    }
    transporter.sendmail(mailOption, (error, info) =>{
        if(error) {
            console.log("Error al enviar correo de recuperacion")
        }else {
            console.log("Correo enviado correctamente", info.response)
        }
        
    })

}