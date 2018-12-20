var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});



//Game vars
var lastPlayderID = 0;
var DIRS = {
    right: 0,
    down: 1,
    left: 2,
    up: 3 
};
var gridSize = 250;
const KEYS = {
  up: 40,
  right: 39,
  down: 38,
  left: 37
};
var players = [];
var apples = [];
for(let i = 0; i < (gridSize * gridSize)/500; i++)
    apples.push({x: randomInt(0,gridSize), y: randomInt(0,gridSize), respawn : function(){
    this.x = randomInt(0,gridSize);
    this.y = randomInt(0,gridSize);   
    }});



server.listen(process.env.PORT || 8080,function(){
    console.log('Listening on '+server.address().port);
});

io.on('connection',function(socket){
    var i;
    let isConnected = false;
    players.forEach((p)=>{
        if(p.con == socket.request.connection.remoteAddress){
            socket.player = p; 
            isConnected = true;
        }
    });
    if(!isConnected){
        socket.player = {
            con: socket.request.connection.remoteAddress,
            id: lastPlayderID++,
            x: randomInt(0,gridSize),
            y: randomInt(0,gridSize),
            dir: randomInt(0,3),
            tail: [],
            inputTimer: 0,
            move : function(){
                // Update tail
                inputTimer++;
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
                    this.y--; break;
                  case DIRS.up:
                    this.y++; break;
                }

                // Check boundaries
                if(this.x > gridSize-1) this.x = 0;
                if(this.x < 0) this.x = gridSize-1;
                if(this.y > gridSize-1) this.y = 0;
                if(this.y < 0) this.y = gridSize-1;
                this.checkCollisions();

            },
            checkCollisions: function() {
                
                this.tail.forEach((t) =>{
                    if(t.x === this.x && t.y === this.y){
                        this.tail.splice(this.tail.indexOf(t));
                    }
                });

                apples.forEach((a) => {
                    if(a.x === this.x && a.y === this.y){
                        this.addTail(2);
                        a.respawn();
                    }
                });

                players.forEach((s) => {

                    //Collide with other heads
                    if(s !== this){
                        if(s !== this && s.x === this.x && s.y === this.y){
                            if(s.tail.length > this.tail.length){
                                for(let i = 0; i < this.tail.length + 2; i++){
                                    s.addTail();
                                }
                                this.respawn();
                            } else{
                                for(let i = 0; i < s.tail.length + 2; i++){
                                    this.addTail();
                                }
                                s.respawn();
                            }
                        }

                        s.tail.forEach((t) =>{
                            if(t.x === this.x && t.y === this.y){
                                for(let i = 0; i <= s.tail.length - s.tail.indexOf(t); i++){
                                    this.addTail();
                                }
                                s.tail.splice(s.tail.indexOf(t));
                            }
                        });
                    }

                });
            },
            respawn : function(){
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
            }
        };
        
        socket.player.addTail(3);
        
        players.push(socket.player);
    }
    socket.emit('allplayers', socket.player, gridSize);

    socket.on('keyDown',function(key){
        socket.player.inputTimer = 0;
        switch (key) {
            case KEYS.up:
            if (socket.player.dir !== DIRS.down)
                socket.player.dir = DIRS.up; break;
          case KEYS.right:
            if (socket.player.dir !== DIRS.left)
                socket.player.dir = DIRS.right; break;
        case KEYS.down:
            if (socket.player.dir !== DIRS.up)
                socket.player.dir = DIRS.down; break;
        case KEYS.left:
            if (socket.player.dir !== DIRS.right)
                socket.player.dir = DIRS.left; break;
        }
    });

    socket.on('disconnect',function(){
        let i = players.indexOf(socket.player);
        players.splice(i, 1);
    });
});


function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function disconnectPlayer(id){
    io.sockets.forEach((socket) => {
        if(socket.player.id === id){
            socket.disconnect();
        }
    });
}

setInterval(() => {
  players.forEach((p) => {
    p.move();
    if(inputTimer > 1000){
        disconnectPlayer(p.id);
        players.splice(players.indexOf(p), 1);
    }
  });
  io.emit('update', {
    players: players.map((p) => ({
      x: p.x,
      y: p.y ,
      id: p.id,
      tail: p.tail
    })),
    apples: apples.map((a) => ({
      x: a.x,
      y: a.y
    }))
  });
}, 100);