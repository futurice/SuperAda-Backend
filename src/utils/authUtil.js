
//const bcrypt = require('bcrypt');
var knex = require('../db').knexlocal;
var secret = 'really_secret_key';
var jwt = require('jsonwebtoken');

exports.checkIfTeamNameAvailable = function(req, res) {
    return true; // TODO
}

exports.hashPassword = function(password) { // TODO
  // Generate a salt at level 10 strength
  const promise = new Promise(
    function(resolve, reject) {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          reject(err);
        }
        bcrypt.hash(password, salt, (error, hash) => {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      });
    }
  );
  return promise;
}

let jwtExpirationHours = 5;
// Crate a json web token for user id and name
exports.createToken = function(id, name, scope) {
  // Sign the JWT
  return {
    token: jwt.sign({id: id, name: name, scope: scope}, secret, {algorithm: 'HS256', expiresIn: jwtExpirationHours + 'h'}),
    expiresIn: jwtExpirationHours * 60 * 60 * 1000 // in milliseconds
  };
}

// Verify authentication request credentials
exports.verifyCredentials = function(req, res) {
  const password = req.payload.password;
  const login = req.payload.login;

  return knex.select('id', 'password', 'name').from('admin').where('name', login)
  .then(function(rows) {
    if (!rows.length) {
      throw exeption("Bad request authutil r:48"); // not found
    }

    const user = rows[0];
    bcrypt.compare(password, user.password, (err, isValid) => {
      if (isValid) {
        res(user);
      }
      else {
        throw exeption("Bad request authutil r:57"); //password/user dont match
      }
    });
  });
}

// Get EMPLOYEE data from jwt
// DO NOT USE THIS TO GET MOBILE USER DATA!
exports.bindEmployeeData = function(req, res) {
  try {
    const bearerToken = req.headers.authorization.slice(7);
    const decoded = jwt.verify(bearerToken, secret, {
      ignoreExpiration: false
    });
    const employeeId = decoded.id;
    const name = decoded.name;

    console.log(decoded);

    knex.first('id', 'name', 'email').from('employees').where({id: employeeId, name: name})
    .then(function(employee) {
      if (!employee) {
        res(Boom.unauthorized('Invalid token'));
      } else {
        res(employee);
      }
    })
    .catch(function(err) {
      console.log(err);
      res(Boom.badRequest(err));
    });
  } catch (e) {
    console.log(e);
    res(Boom.badRequest(e));
  }
}

// Get USER data from jwt
// Note that checking for expiration is todo
/*export function bindUserData(req, res) {
  try {
    const bearerToken = req.headers.authorization.slice(7);
    const decoded = jwt.verify(bearerToken, secret, {
      ignoreExpiration: true
    });
    const userId = decoded.id[0];
    const name = decoded.name;
    knex.first('id', 'name', 'assigneeId').from('users').where({id: userId, name: name})
    .then(function(user) {
      if (!user) {
        res(Boom.unauthorized('Invalid token'));
      } else {
        res(user);
      }
    })
    .catch(function(err) {
      console.log(err);
      res(Boom.unauthorized('Invalid token'));
    });
  } catch (e) {
    res(Boom.unauthorized('Invalid token'));
  }
}*/
