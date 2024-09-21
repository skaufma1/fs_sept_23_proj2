let myServer = require('./my_server.js');
let myApi = require('./my_api.js');
let actions = {
    "/get_users"    :myApi.getUsers,
    "/add_user"     :myApi.addUser,
    "/update_user"  :myApi.updateUser
};

myServer.startServer(actions);