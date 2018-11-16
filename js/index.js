
// 事件中心
var EventCenter = {
    on:function(type,handler){
        $(document).on(type,handler);
    },
    fire:function(type,data){
        $(document).trigger(type,data);
    }
}

// 当监听到hello事件的时候，打印data
// EventCenter.on('hello',function(e,data){
//     console.log(data);
// })
// 触发一个hello事件，data是你好
// EventCenter.fire('hello','你好');


var Footer = {
    init:function(){
        this.$footer = $('footer');
        this.$ul = this.$footer.find('ul');
        this.$box = this.$footer.find('.box');
        this.$leftBtn = this.$footer.find('.icon-left');
        this.$rightBtn = this.$footer.find('.icon-right');
        this.isToEnd = false;
        this.isToStart = true;
        this.isAnimate = false;
        this.bind();
        this.render();
    },
    bind:function(){
        var _this = this;
        $(window).resize(function(){
            _this.setStyle();
        });
        this.$rightBtn.on('click',function(){
            if(_this.isAnimate) return;
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth); 

            if(!_this.isToEnd){
                // 如果下一行代码就要动画，这里就可以把正在动画设为true了
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: '-=' + rowCount * itemWidth
                }, 400, function () {
                    // 动画完成之后 isAnimate设为fale  这个就是加锁
                    _this.isAnimate = false;
                    _this.isToStart = false;
                    if (_this.$box.width() - parseInt(_this.$ul.css('left')) >= _this.$ul.width()) {
                        _this.isToEnd = true;
                    }
                })
            }
        })

        this.$leftBtn.on('click',function(){
            if(_this.isAnimate) return ;
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth);

            if (!_this.isToStart) {
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: '+=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false;
                    _this.isToEnd = false;
                    if (parseInt(_this.$ul.css('left'))>=0){
                        _this.isToStart = true;
                    }
                })
            }
        })

        this.$footer.on('click','li',function(){
            $(this).addClass('active').siblings().removeClass('active')

            EventCenter.fire('select-album', {
                channelId: $(this).attr('data-channel-id'),
                channelName:$(this).attr('data-channel-name')
            });
            
        })
    },
    render:function(){
        var _this = this;
        $.getJSON('http://api.jirengu.com/fm/getChannels.php')
        .done(function(ret){
            console.log(ret);
            _this.renderFooter(ret.channels);
        }).error(function(){
            console.log('error...');
        })
    },
    renderFooter:function(channels){
        console.log(channels)
        var html = '';
        channels.forEach(function(channel){
            html += '<li data-channel-id=' + channel.channel_id +' data-channel-name='+channel.name+'>'
                + '<div class="cover" style="background-image:url(' +channel.cover_small+')"></div>'
                + '<h3>' +channel.name+'</h3>'
                +'</li>';
        })
        this.$ul.html(html);
        this.setStyle();
    },
    setStyle:function(){
        var count = this.$footer.find('li').length;
        console.log(count);
        
        var width = this.$footer.find('li').outerWidth(true);
        console.log(width);
        
        this.$ul.css({
            width:count*width+'px'
        })
    }
}




var Fm = {
    init(){
        // 先设定一个选择范围
        this.$container = $('#page-music');
        this.audio = new Audio();
        this.audio.autoplay = true;

        this.bind();
    },
    bind(){
        var _this = this;
        EventCenter.on('select-album', function (e, channelObj) {
            _this.channelId = channelObj.channelId;
            _this.channelName = channelObj.channelName;
            _this.loadMusic();
        })

        this.$container.find('.btn-play').on('click',function(){
            var $btn = $(this);
            if($btn.hasClass('icon-play')){
                $btn.removeClass('icon-play').addClass('icon-pause');
                _this.audio.play();
            }else{
                $btn.removeClass('icon-pause').addClass('icon-play');
                _this.audio.pause();
            }
        })

        this.$container.find('.icon-next').on('click',function(){
            
            _this.loadMusic();
        })

        this.audio.addEventListener('play',function(){
            console.log('play'); 
            // 点下一首播放也会触发计时器，所以会有两个计时器，要先清除掉
            clearInterval(_this.statusClock);
            _this.statusClock = setInterval(function(){
                _this.updataStatus();
            },1000)
        })

        this.audio.addEventListener('pause', function () {
            console.log('pause');
            clearInterval(_this.statusClock);
        })

        
    },
    loadMusic(callback){
        var _this = this;
        console.log('loadmusic');
        // 发送请求的时候，不写协议，那么发送协议的时候就会按照谁发送就按照谁的协议
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId}).done(function(ret){
            _this.song = ret['song'][0];
            _this.setMusic();
            _this.loadLyric();
        })
    },
    // 设置歌词
    loadLyric(){
        var _this = this;
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid}).done(function(ret){
            var lyric = ret.lyric;
            var lyricObj = {};
            //歌词是一个字符串，先转换为字符串数组，然后遍历
            lyric.split('\n').forEach(function(line){
                //[01:10.25] [01:20.25] it's a new day
                var times = line.match(/\d{2}:\d{2}/g);
                // times == ['01:10.25','01:20.25']
                var str = line.replace(/\[.+?\]/g,"");
               if(Array.isArray(times)){
                   // 把时间和对应的歌词以键值对的形式存放到对象里
                   times.forEach(function (time) {
                       lyricObj[time] = str;
                   })
               }
            })
            _this.lyricObj = lyricObj;
            
        })
    },
    setMusic(){
        console.log("set music ...");
        console.log(this.song);
        this.audio.src = this.song.url;
        $('.bg').css('background-image','url('+this.song.picture+')');
        this.$container.find('.aside figure').css('background-image', 'url(' + this.song.picture + ')');
        this.$container.find('.details h1').text(this.song.title);
        this.$container.find('.details .author').text(this.song.artist);
        this.$container.find('.details .tag').text(this.channelName);
        this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause');
    },
    updataStatus:function(){
        var min = Math.floor(this.audio.currentTime/60);
        var second = Math.floor(this.audio.currentTime%60)+"";
        second = second.length === 2?second:'0'+second;
        this.$container.find('.current-time').text(min+':'+second);
        this.$container.find('.bar-progress').css('width',(this.audio.currentTime/this.audio.duration)*100+'%')

        var line = this.lyricObj['0' + min + ':' + second];
        if(line){
            this.$container.find('.lyric p').text(line).boomText('');
        }
    }
}

// jQuery插件
$.fn.boomText = function(type){
    type = type || 'rollIn'
    console.log(type);
    this.html(function(){
        var arr = $(this).text().split('').map(function(word){
            return '<span class="boomText">'+word+'</span>'
        })
        return arr.join('');
    })
    var index = 0;
    var $boomText = $(this).find('span');
    var clock = setInterval(function(){
        $boomText.eq(index).addClass('animated '+type);
        index++;
        if(index >= $boomText.length){
            clearInterval(clock);
        }
    },300)
}









Footer.init();
Fm.init();




