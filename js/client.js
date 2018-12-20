/**
 * Created by Jerome on 03-03-17.
 */

var Client = {};
Client.socket = io.connect();

var player = {};
var canvas = document.getElementById('game');
var ctx = canvas.getContext("2d");

Client.sendTest = function(){
    console.log("test sent");
    Client.socket.emit('test');
};

document.onkeydown = (ev) =>{
    Client.socket.emit('keyDown', ev.keyCode);
}

Client.socket.on('allplayers',function(data){
    player = data;
});
Client.socket.on('update',function(data){
    draw(data);
});

function draw(data){
    console.log(data);

    ctx.clearRect(0,0, 800, 600);
    data.players.forEach((p) => {
        if(p.id === player.id)
            ctx.fillStyle = 'black';
        else
            ctx.fillStyle = 'blue';
        ctx.fillRect(p.x * 20, p.y * 20, 20, 20);
        p.tail.forEach((t) =>{
            ctx.fillRect(t.x * 20, t.y * 20, 20, 20);
        });
    });
    ctx.fillStyle = 'red';
    data.apples.forEach((a) =>{
        ctx.fillRect(a.x * 20, a.y * 20, 20, 20);
    })
}

