import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from "bcrypt";

export default  function initialize(passport, getUserByEmail, getUserById) {

    const authenticateUser = async (email, password, done) => {
        
        try {
            const user = await getUserByEmail(email);


            if (!user) {
                console.log("No user here please confirm")
                return done(null, false, {message: 'No user with that email'})
            }


            bcrypt.compare(password, user.pass, (err, response) => {
                console.log(`Entered bcrypt and data is  : ${user.pass}`);
                if(err) {
                    console.log(`Output error with err inside bcrypt is : ${err}`);
                   return done(err);
                } else if (response) {
                    console.log(`Login successful, the data output is : ${response}`);
                  // return  done(null, user);
                  return done(null, {id: user.id, email: user.email});
                } else {
                    console.log( `The response is : ${response}`)
                  return  done(null, false, {message: 'Password Incorrect'});
                }   
            })
        } catch (error) {
            console.log(`The error given is : ${error}`)
            return done(error);
        }
    }

    passport.use(new LocalStrategy( {usernameField: 'username'}, authenticateUser)) 
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => { 
        return done(null, getUserById(id))
     })
}

// module.exports = initialize