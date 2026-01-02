const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const UserRepository = require("../../repositories/UserRepository");
const { ApiError } = require("../../middleware/errorHandler");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
          return done(new ApiError(401, "Incorrect email or password"), false);
        }

        const isMatch = await user.comparePassword(password, user.password);
        if (!isMatch) {
          return done(new ApiError(401, "Incorrect email or password"), false);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
