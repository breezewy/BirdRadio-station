

// 自定义事件监听
var EventCenter = {

    on:function(type,handler){
        $(document).on(type,handler);
    },
    fire:function(type,data){
        $(document).trigger(type,data);
    }
}

// EventCenter.on('abd',function(e,data){
//     console.log(data);
// })
// EventCenter.fire('abd','hello world');


var Footer = {
    init:function(){
        this.$footer = $('footer');
        this.$ul = this.$footer.find('ul');
        this.$box = this.$footer.find('.box');
        this.$rightBtn = this.$footer.find('.icon-right');
        this.$leftBtn = this.$footer.find('.icon-left');
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
            var itemWidth = _this.$box.find('li').outerWidth(true);
            var rowCount = Math.floor(_this.$box.width() / itemWidth);
           if(!_this.isToEnd){
               _this.isAnimate = true;
               _this.$ul.animate({
                   left: '-=' + itemWidth * rowCount
               },400,function(){
                   _this.isAnimate = false;
                   _this.isToStart = false;
                   if (_this.$box.width() - parseInt(_this.$ul.css('left')) >= _this.$ul.width()){
                       _this.isToEnd = true;
                   }
               })
           }
        })

        this.$leftBtn.on('click',function(){
            if(_this.isAnimate) return ;
            var itemWidth = _this.$box.find('li').outerWidth(true);
            var rowCount = Math.floor(_this.$box.width() / itemWidth);
            if(!_this.isToStart){
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: '+=' + itemWidth * rowCount
                },400,function(){
                    _this.isAnimate = false;
                    _this.isToEnd = false;
                    if (parseInt(_this.$ul.css('left'))>=0){
                        _this.isToStart = true;
                    }
                })
            }
        })

        this.$footer.on('click','li',function(){
            var _this = this;
            $(this).addClass('active').siblings().removeClass('active');
            EventCenter.fire('select-album', {
                channelId: $(this).attr('data-channel-id'),
                channelName:$(this).attr('data-channel-name')
            });
        })
       
    },
    render:function(){
        var _this = this;
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php').done(function(ret){
            _this.renderFooter(ret.channels);
        }).error(function(){
            console.log('data error....');
        })
    },
    renderFooter:function(channels){
        var html = '';
        channels.forEach(function(channel){
            html += '<li data-channel-id=' + channel.channel_id+' data-channel-name='+channel.name+'>'
                + '<div class="cover" style="background-image:url(' + channel.cover_small+')"></div>'
                +'<h3>'+channel.name+'</h3>'
                +'</li>'
        })
        this.$ul .html(html);
        this.setStyle();
    },
    setStyle:function(){ 
        var count = this.$footer.find('li').length;
        var width = this.$footer.find('li').outerWidth(true);
        this.$ul.css('width',count*width);
    }
}



var Fm = {
    init:function(){
        this.$container = $('#page-music');
        this.audio = new Audio();
        this.proportion = (this.audio.currentTime / this.audio.duration) * 100 + '%'
        this.bind();
    },
    bind:function(){
        var _this = this;
        EventCenter.on('select-album',function(e,channelObj){
            _this.channelId = channelObj.channelId;
            _this.channelName = channelObj.channelName;
            _this.loadMusic()
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
        
        // 播放器监听到播放状态的时候，就启动计时器，调用updataStatus
        this.audio.addEventListener('play',function(){
            console.log('music play...');
            clearInterval(_this.statusClock);
            _this.statusClock = setInterval(function(){
                _this.updataStatus();
            },1000)
        })
        this.audio.addEventListener('pause', function () {
            console.log('music pause...');
            clearInterval(_this.statusClock);
        })
        this.$container.find('.bar').on('click',function(e){
            if ($('.btn-play').hasClass('icon-play')) {
                $('.btn-play').removeClass('icon-play').addClass('icon-pause');
                _this.audio.play();
            } 
            _this.audio.currentTime = e.offsetX/_this.$container.find('.bar').width()*_this.audio.duration;
        })
       
    },
    loadMusic(){
        var _this = this;
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId}).done(function(ret){
            _this.song = ret['song'][0];
            _this.setMusic();
            _this.loadLyric();
        })
    },
    loadLyric(){
        var _this = this;
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid}).done(function(ret){
            var lyric  = ret.lyric;
            console.log(lyric);
            
            var lyricObj = {};
            lyric.split('\n').forEach(function(line){
                //[01:20.25][01:32.30] hello a new day
                var times = line.match(/\d{2}:\d{2}/g);
                //times 是一个数组，['01:20.25','01:32.30']
                var str = line.replace(/\[.+?\]/,"");

                // 把时间和对应的歌词以键值对的形式存放到对象里
                if(Array.isArray(times)){
                    times.forEach(function(time){
                        lyricObj[time] = str;
                    })
                }
                // 上边已经把歌词放到了一个对象里，为了下边方便使用，把歌词赋值给Fm的一个属性
                _this.lyricObj = lyricObj;
                
            })
            
        })
    },
    setMusic(){
        this.audio.src = this.song.url;
        this.audio.autoplay = true;
        $('.bg').css('background-image', 'url(' + this.song.picture+')');
        this.$container.find('.aside figure').css('background-image', 'url(' + this.song.picture+')');
        this.$container.find('.details h1').text(this.song.title);
        this.$container.find('.details .author').text(this.song.artist);
        this.$container.find('.aside .btn-play').removeClass('icon-play').addClass('icon-pause');
        this.$container.find('.tag').text(this.channelName);
    },
    updataStatus(){
        var min = Math.floor(this.audio.currentTime/60);
        var second = Math.floor(this.audio.currentTime%60)+"";
        second = second.length===2?second:'0'+second;
        this.$container.find('.current-time').text(min+':'+second);
        this.$container.find('.bar-progress').css('width', (this.audio.currentTime / this.audio.duration)*100+'%');

        // 这里有当前音乐播放的分钟和秒数，可以用来获取对应的歌词,然后把歌词显示在页面上
        var line = this.lyricObj['0' + min + ':' + second]
        if(line){
            // 歌词设置好以后，调用自定义的jQuery插件，实现炫酷的歌词动画效果
            this.$container.find('.lyric p').text(line)
                .boomText();
        }
    }

}

// jQuery插件，结合animate.css工具，实现炫酷动画效果
$.fn.boomText = function(type){
    type = type||'rollIn';
    this.html(function(){
        // 遍历每一行歌词，给每个字都用span包裹，然后给每个span动画
        var arr = $(this).text().split('').map(function(word){
            return  '<span class="boomText">'+word+'</span>'
        });
        return arr;
    })
    var index = 0;
    var $boomText = $(this).find('span');
    var clock = setInterval(function(){
        $boomText.eq(index).addClass('animated '+type);
        index++;
        if (index >= $boomText.length){
            clearInterval(clock);
        }
    },200)
}


Footer.init();
Fm.init();