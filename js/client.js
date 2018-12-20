/**
 * Created by Jerome on 03-03-17.
 */

var Client = {};
Client.socket = io.connect();

var player = {};
var canvas = document.getElementById('game');
var ctx = canvas.getContext("2d");
var screenWidth = canvas.width,
    screenHeight = canvas.height,
    gridWidth = screenWidth/100,
    gridHeight = screenHeight/100,
    mapSize = 0,
    cameraOfSet = {x: 0, y: 0};

document.onkeydown = (ev) =>{
    Client.socket.emit('keyDown', ev.keyCode);
}

Client.socket.on('allplayers',function(data, size){
    player = data;
    mapSize = size;
});
Client.socket.on('update',function(data){
    draw(data);
});

function camera(){
    if(player.x * gridWidth > screenWidth/2){
        cameraOfSet.x = player.x * gridWidth - screenWidth/2;
        cameraOfSet.x = (cameraOfSet.x < mapSize * gridWidth - screenWidth)? cameraOfSet.x : mapSize * gridWidth - screenWidth; 
    } else{
        cameraOfSet.x = 0;
    }
    if(player.y * gridHeight > screenHeight/2){
        cameraOfSet.y = player.y * gridHeight - screenHeight/2;
        cameraOfSet.y = (cameraOfSet.y < mapSize * gridHeight - screenWidth)? cameraOfSet.y : mapSize * gridHeight - screenWidth; 
    } else{
        cameraOfSet.y = 0;
    }
}

function draw(data){

    data.players.forEach((p) => {
        if(p.id === player.id){
            player = p;
        }
    });

    camera();

    ctx.clearRect(0,0, screenWidth, screenHeight);
    data.players.forEach((p) => {
        if(p.id === player.id)
            ctx.fillStyle = 'black';
        else
            ctx.fillStyle = 'blue';
        ctx.fillRect(p.x * gridWidth - cameraOfSet.x, p.y * gridHeight - cameraOfSet.y, gridWidth, gridHeight);
        p.tail.forEach((t) =>{
            ctx.fillRect(t.x * gridWidth - cameraOfSet.x, t.y * gridHeight - cameraOfSet.y, gridWidth, gridHeight);
        });
    });
    ctx.fillStyle = 'red';
    data.apples.forEach((a) =>{
        ctx.fillRect(a.x * gridWidth - cameraOfSet.x, a.y * gridHeight - cameraOfSet.y, gridWidth, gridHeight);
    })
}

