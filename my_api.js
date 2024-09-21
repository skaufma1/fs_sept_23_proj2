let mysql = require('mysql');
let dbConnectionDetails = require('./db_config');

exports.getUsers = (req, res, q)=>{
       
    let conn = mysql.createConnection(dbConnectionDetails);
    conn.connect((err)=>{
        if(err){
            res.writeHeader(500, {'Content-Type':'text/plain'});
            res.end("Error: Could not Connect to DB");
            return;
        }
        conn.query("FLUSH TABLES users", [], (err, result)=>{
            if (err){
                console.log("TABLE FLUSH ended with an error");
                conn.destroy();
            }
            else {
                console.log("TABLES FLUSH was OK !!! :)");                        
            }
        });

        conn.query("SELECT username, highest_score, highest_score_date FROM users ORDER BY highest_score DESC, highest_score_date DESC", (err, result)=>{
            if(err){
                res.writeHeader(500, {'Content-Type':'text/plain'});
                res.end("Error: Could not Query Users" + err);
                conn.destroy();
                return;
            }
            conn.destroy();
            res.writeHeader(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify(result));
        });
    });    
};

exports.addUser = (req, res, q)=>{
    if(req.method != "POST"){
        res.writeHeader(400, {'Content-Type':'text/plain'});
        res.end("Error: Expected POST Request");
        return;
    }
    let bodyString = '';
    req.on('data', chunk=>{
        bodyString += chunk;
    });
    req.on('end', ()=>{
        
        let username = undefined;
        try{
            username = JSON.parse(bodyString);
        }catch{
            res.writeHeader(400, {'Content-Type':'text/plain'});
            res.end("Error: Invalid JSON");
            return;
        }
        
        if(username == null || username == undefined){
            res.writeHeader(400, {'Content-Type':'text/plain'});
            res.end("Error: Invalid Username");
            return;
        }
        
        let conn = mysql.createConnection(dbConnectionDetails);
        conn.connect((err)=>{
            if(err){
                res.writeHeader(500, {'Content-Type':'text/plain'});
                res.end("Error: Could not Connect to DB");
                return;
            }
            conn.query("INSERT INTO users (username, last_login, score, highest_score, highest_score_date) VALUES (?, CURDATE(), 0, 0, CURDATE())", [username], (err, result)=>{
                if(err){
                    if(err.errno == 1452){
                        res.writeHeader(400, {'Content-Type':'text/plain'});
                        console.log(err);
                        res.end("Error: Constraints Voilation - User already exists");
                        conn.destroy();
                        return;
                    }else{
                        res.writeHeader(500, {'Content-Type':'text/plain'});
                        console.log(err);
                        res.end("DB Error: Could not Insert ");
                        conn.destroy();
                        return;
                    }                    
                }
                if(result.affectedRows == 1){
                    res.writeHeader(200, {'Content-Type':'text/plain'});
                    res.end("ok");
                    conn.destroy();
                    return;
                }else{
                    res.writeHeader(500, {'Content-Type':'text/plain'});
                    res.end("Error: Could not Insert");
                    conn.destroy();
                    return;
                }
            });
        });        
    });
};

exports.updateUser = (req, res, q)=>{
    if(req.method != "POST"){
        res.writeHeader(400, {'Content-Type':'text/plain'});
        res.end("Error: Expected POST Request");
        return;
    }
    let bodyString = '';
    req.on('data', chunk=>{
        bodyString += chunk;
    });
    req.on('end', ()=>{
        
        let username = undefined;
        let score = undefined;
        let body = undefined;
        try{
            body = JSON.parse(bodyString);
            username = body.username;
            score = body.score
        }catch{
            res.writeHeader(400, {'Content-Type':'text/plain'});
            res.end("Error: not a Valid JSON");
            return;
        }
        
        if(score == null || score == undefined){
            res.writeHeader(400, {'Content-Type':'text/plain'});
            res.end("Error: invalid Score to Update in DB");
            return;
        }
        
        let conn = mysql.createConnection(dbConnectionDetails);
        conn.connect((err)=>{
            if(err){
                res.writeHeader(500, {'Content-Type':'text/plain'});
                res.end("Error: Could not Connect to DB");
                return;
            }
            conn.query("UPDATE users SET score=?, highest_score_date = CASE WHEN score > highest_score THEN CURDATE() ELSE highest_score_date END, highest_score=CASE WHEN score > highest_score THEN score ELSE highest_score END WHERE username=?", [score, username], (err, result)=>{
                if(err){
                    if(err.errno == 1452){
                        res.writeHeader(400, {'Content-Type':'text/plain'});
                        console.log(err);
                        res.end("UPDATE Error: Violating C  onstraints ");
                        conn.destroy();
                        return;
                    }else{
                        res.writeHeader(500, {'Content-Type':'text/plain'});
                        console.log(err);
                        res.end("Error: Could not Update ");
                        conn.destroy();
                        return;
                    }                    
                }
                if(result.affectedRows != 1){
                    res.writeHeader(500, {'Content-Type':'text/plain'});
                    res.end("Error: No such User to Update");
                    conn.destroy();
                    return;                    
                }
                res.writeHeader(200, {'Content-Type':'text/plain'});
                res.end("Update Successful");
                console.log("Username: ", username, " Score so far: ", score);
                
                conn.query("FLUSH TABLES users", [], (err, result)=>{
                    if (err){
                        console.log("TABLE FLUSH ended with an error");
                        conn.destroy();
                    }
                    else {
                        console.log("TABLES FLUSH was OK !!! :)");                        
                    }
                });
        
                conn.destroy();                
            });
        });        
    });
};