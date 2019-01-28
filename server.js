var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));
app.use('/game',express.static(__dirname + '/game'));


app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});



//Game vars
var lastPlayderID = 0;
var DIRS = {
    right: 0,
    down:  1,
    left:  2,
    up:    3 
};
var gridSize = 250;
const KEYS = {
  up:    38,
  right: 39,
  down:  40,
  left:  37,
  space: 32
};
var usernames = [];
var players   = [];
var apples    = [];
var shots     = [];
var appleChances = [
{odds: 1,      value: 1  ,colour: "#ff0400"},
{odds: 0.6,    value: 2  ,colour: "#ff5100"},
{odds: 0.5,    value: 3  ,colour: "#ff9500"},
{odds: 0.25,   value: 4  ,colour: "#ffd000"},
{odds: 0.20,   value: 5  ,colour: "#c8ff00"},
{odds: 0.15,   value: 6  ,colour: "#59ff00"},
{odds: 0.10,   value: 7  ,colour: "#00ff73"},
{odds: 0.05,   value: 8  ,colour: "#03ffb3"},
{odds: 0.025,  value: 9  ,colour: "#02eaff"},
{odds: 0.01,   value: 10 ,colour: "#0379ff"},
{odds: 0.005,  value: 20 ,colour: "#042eff"},
{odds: 0.0005, value: 100,colour: "#ff00d9"},
];
var connections = [];

for(let i = 0; i < (gridSize * gridSize)/100; i++)
    apples.push({x: randomInt(0,gridSize), 
    y: randomInt(0,gridSize), 
    value: randomThroughCance(),
    colour : "#ff0400",
    respawn : function(){
        this.x = randomInt(0,gridSize);
        this.y = randomInt(0,gridSize);
        this.value = randomThroughCance();
        this.setColour();
    },
    setColour : function(){
        for(let i = 0; i < appleChances.length; i++){
            if(appleChances[i].value === this.value){
                this.colour = appleChances[i].colour;
                break;
            }
        }
    }
});
apples.forEach((a) => a.setColour());



server.listen(process.env.PORT || 8080,function(){
    console.log('Listening on '+server.address().port);
});

io.on('connection',function(socket){
    var i;
    let isConnected = false;
    /*players.forEach((p)=>{
        if(p.con == socket.request.connection.remoteAddress){
            socket.player = p; 
            isConnected = true;
        }
    });*/
    if(!isConnected){
        socket.player = {
            con: socket.request.connection.remoteAddress,
            id: lastPlayderID++,
            x: randomInt(0,gridSize),
            y: randomInt(0,gridSize),
            dir: randomInt(0,3),
            tail: [],
            lastDir: 0,
            inputTimer: 0,
            speed: 5,
            moveTimer: 0,
            score: 0,
            shoot: false,
            move : function(){

                //if lenght is below 4 the snake dies

                if(this.tail.length < 3){
                    this.tailToFood(-1);
                    this.respawn();
                }

                // Update tail
                this.inputTimer++;
                if(this.moveTimer >= this.speed){
                    for(var i = this.tail.length-1; i >= 0; i--) {
                    this.tail[i].x = (i===0) ? this.x : this.tail[i-1].x;
                    this.tail[i].y = (i===0) ? this.y : this.tail[i-1].y;
                    }

                    // Move head
                    switch(this.dir) {
                    case DIRS.right:
                        this.x++; break;
                    case DIRS.left:
                        this.x--; break;
                    case DIRS.down:
                        this.y++; break;
                    case DIRS.up:
                        this.y--; break;
                    }

                    // Check boundaries
                    if(this.x > gridSize-1) this.x = 0;
                    if(this.x < 0) this.x = gridSize-1;
                    if(this.y > gridSize-1) this.y = 0;
                    if(this.y < 0) this.y = gridSize-1;
                    this.lastDir = this.dir; 
                    //As the movetimer is incremented at the end of move
                    this.moveTimer = -1;
                    this.checkCollisions();
                }
                if(this.shoot){
                    if(this.tail.length > 3){
                        let snake = this;
                        let size = 1;
                        let shot = {
                            x: snake.x,
                            y: snake.y,
                            dir: snake.dir,
                            shooter: snake,
                            update: function(){
                                switch(this.dir) {
                                    case DIRS.right:
                                        this.x++; break;
                                    case DIRS.left:
                                        this.x--; break;
                                    case DIRS.down:
                                        this.y++; break;
                                    case DIRS.up:
                                        this.y--; break;
                                    }
                                    
                                    if(this.x > gridSize-1) this.x = 0;
                                    if(this.x < 0) this.x = gridSize-1;
                                    if(this.y > gridSize-1) this.y = 0;
                                    if(this.y < 0) this.y = gridSize-1;

                                    this.checkCollisions();
                            },
                            checkCollisions: function(){
                                
                                apples.forEach((a) =>{
                                    if(a.x === this.x && a.y === this.y){
                                        a.respawn();
                                        if(this.size < 5)
                                            shots.splice(shots.indexOf(this), 1);                                        
                                    }
                                });

                                shots.forEach((s) => {
                                    if(s !== this && s.x === this.x && s.y === this.y){
                                        shots.splice(shots.indexOf(s)   , 1);
                                        if(this.size < 10)
                                            shots.splice(shots.indexOf(this), 1);
                                    }
                                });
                
                                players.forEach((s) => {
                                    if(s.x === this.x && s.y === this.y){
                                        s.tailToFood(-1);
                                        if(this.size < 50)
                                            shots.splice(shots.indexOf(this), 1);
                                        s.respawn();
                                        if(s === this.shooter) s.score--;
                                        else this.shooter.score++;
                                    }
                
                                    s.tail.forEach((t) =>{
                                        if(t.x === this.x && t.y === this.y){
                                            s.tailToFood(s.tail.indexOf(t));
                                            s.tail.splice(s.tail.indexOf(t),1);
                                            if(s.tail.length < 3){
                                                if(s === this.shooter) s.score--;
                                                else this.shooter.score++;
                                            }
                                            if(this.size < 25)
                                                shots.splice(shots.indexOf(this), 1);
                                        }
                                    });
                
                                });
                            }
                        };
                        if(this.tail.length > 53){
                            size = 50;
                        } else if(this.tail.length > 28){
                            size = 25;
                        } else if(this.tail.length > 13){
                            size = 10; 
                        } else if(this.tail.length > 8){
                            size = 5;
                        } 

                        shot.size = size;

                        shots.push(shot);
                        shot.update();

                        this.tail.splice(this.tail.length-(size + 1), size);
                        this.setSpeed();
                    }
                }
                this.shoot = false;
                this.moveTimer++;

            },
            checkCollisions: function() {
                
                this.tail.forEach((t) =>{
                    if(t.x === this.x && t.y === this.y){
                        this.tailToFood(this.tail.indexOf(t));
                        this.tail.splice(this.tail.indexOf(t),1);
                    }
                });

                apples.forEach((a) => {
                    if(a.x === this.x && a.y === this.y){
                        this.addTail(a.value);
                        a.respawn();
                    }
                });

                players.forEach((s) => {

                    //Collide with other heads
                    if(s !== this){
                        if(s !== this && s.x === this.x && s.y === this.y){
                            if(s.tail.length > this.tail.length){
                                this.tailToFood(-1);
                                s.addTail();
                                this.respawn();
                            } else{
                                this.score++;
                                this.addTail();
                                s.tailToFood(-1);
                                s.respawn();
                            }
                        }

                        s.tail.forEach((t) =>{
                            if(t.x === this.x && t.y === this.y){
                                s.tailToFood(s.tail.indexOf(t));
                                this.addTail();
                                s.tail.splice(s.tail.indexOf(t),1);
                                if(s.tail.length < 4) this.score++;
                            }
                        });
                    }

                });
            },
            respawn: function(){
                this.x = randomInt(0,gridSize);
                this.y = randomInt(0,gridSize);
                this.dir = randomInt(0,3);
                this.tail = [];
                this.addTail(3);
            },
            addTail : function(l){
                if(!l) l = 1;
                while(l--)
                    this.tail.push({x: this.x, y: this.y});
                this.setSpeed();
            },
            tailToFood : function(index){
                let i = index + 1;

                while(this.tail[i]){
                    let a = {x: this.tail[i].x, y: this.tail[i].y, value: 1,respawn: function(){
                            apples.splice(apples.indexOf(this), 1);
                        },
                        setColour : function(){
                            for(let i = 0; i < appleChances.length; i++){
                                if(appleChances[i].value === this.value){
                                    this.colour = appleChances[i].colour;
                                    break;
                                }
                            }
                        }
                    };
                    a.setColour();    
                    apples.push(a);
                    this.tail.splice(i, 1);
                }
                this.setSpeed();
                
            },
            setSpeed : function(){
                this.speed = 1 + ((this.tail.length - 4) * 0.1);
            }
        };
        
        socket.player.addTail(3);
        
        players.push(socket.player);
    }
    socket.emit('allplayers', socket.player, gridSize);

    socket.on('username',function(usrname){
        if(usernames.includes(usrname)){
            socket.emit('usernameTaken');
            disconnectPlayer(socket.player.id);
            return;
        } else{
            usernames.push(usrname);
            socket.player.username = usrname;
        }
    });

    socket.on('keyDown',function(key){
        socket.player.inputTimer = 0;        
        switch (key) {
            case KEYS.up:
                if (socket.player.lastDir !== DIRS.down)
                    socket.player.dir = DIRS.up; break;
            case KEYS.right:
                if (socket.player.lastDir !== DIRS.left)
                    socket.player.dir = DIRS.right; break;
            case KEYS.down:
                if (socket.player.lastDir !== DIRS.up)
                    socket.player.dir = DIRS.down; break;
            case KEYS.left:
                if (socket.player.lastDir !== DIRS.right)
                    socket.player.dir = DIRS.left; break;
            case KEYS.space:
                socket.player.shoot = true;
                
        }

    });

    socket.on('disconnect',function(){
        let i = players.indexOf(socket.player);
        players.splice(i, 1);
        usernames.splice(usernames.indexOf(socket.player.username), 1);
        connections.splice(connections.indexOf(socket), 1);
    });
    connections.push(socket);
});


function randomInt (low, high) {
    return (Math.random() * (high - low) + low) | 0;
}
function randomThroughCance (){
    let rdm = Math.random();
    let val = 1;

    appleChances.forEach((c) =>{
        if(rdm < c.odds && val < c.value){
            val = c.value;
        }
    });

    return val;
    
}

function disconnectPlayer(id){
    connections.forEach((socket) => {
        if(socket.player.id === id){
            console.log("disconnect player due to innactivity");
            socket.disconnect();
        }
    });
}

setInterval(() => {
  players.forEach((p) => {
    p.move();
    if(p.inputTimer > 10000){
        disconnectPlayer(p.id);
        players.splice(players.indexOf(p), 1);
    }
  });
  shots.forEach((s) =>{
      s.update();
  });
  io.emit('update', {
    players: players.map((p) => ({
      x: p.x,
      y: p.y ,
      id: p.id,
      tail: p.tail,
      username: p.username,
      score: p.score
    })),
    apples: apples.map((a) => ({
      x: a.x,
      y: a.y,
      colour: a.colour
    })),
    shots: shots.map((s) => ({
        x: s.x,
        y: s.y,
        shid: s.shooter.id
    }))
  });
}, 10);