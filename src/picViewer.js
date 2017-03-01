/**
 * sf-picViewer 组件
 *
 * @author:   morrain
 * @date:     Feb 27, 2017 2:30 PM
 *
 * @props  {String} prop         -参数         
 * 
 */

var CON_MAX_WIDTH = 1024,
    CON_MIN_WIDTH = 360,
    CON_MAX_HEIGHT = 768,
    CON_MIN_HEIGHT = 360;


function num2px(num) {
    return num + 'px';
}

function px2num(str) {
    return Number(str.replace('px', '')) || 0;
}

function getStyle(ele, name) {
    var _current = window.getComputedStyle(ele, null);
    return _current[name] || '';
}

function setStyle(ele, name, value) {
    ele.style[name] = value;
}

function getImageSize(image, callback) {
    var newImage;

    // Modern browsers
    if (image.naturalWidth) {
        return callback(image.naturalWidth, image.naturalHeight);
    }

    // IE8: Don't use `new Image()` here
    newImage = document.createElement('img');
    newImage.onload = function() {
        callback(this.width, this.height);
    };
    newImage.src = image.src;
}


require('./picViewer.scss');

module.exports = {
    name: 'sf-picviewer',
    template: require('./picViewer.html'),
    props: {
        pics: {
            type: Array,
            default: function() {
                return [{ name: 'aaa.jpg', src: 'http://aa.bb.cc/aaa.jpg' }]; //待查看的图片信息数组
            }
        }
    },
    data: function() {
        return {
            index: 0, //默认显示图片的索引
            isShow: false, //是否显示图片查看器
            fullEnabled: document.fullscreenEnabled ||
                document.mozFullScreenEnabled ||
                document.webkitFullscreenEnabled ||
                document.msFullscreenEnabled,
            container: {
                showtime: 0, //记录调用show显示的次数，初次显示居中显示图片
                el: null,
                style: null,
                action: false, //可以取值有'move'
                isFull: false //是否全屏
            },
            image: {
                el: null,
                ratio: 0
            }
        };
    },
    methods: {
        /**
         * 要显示的图片，要跟pics数组中能匹配
         * 参数不传，表示纯粹显示
         * @param  {Number} index        - 要显示图片在数组中的索引
         */
        show: function(index) {
            if (index === undefined) return this.isShow = true;

            var con = this.container,
                can = this.$refs.canvas,
                src = this.pics[index] && this.pics[index].src;

            if (src) {

                can.childNodes[0] && can.removeChild(can.childNodes[0]);
                this.isShow = true;
                con.el.focus();

                var img = this.image.el = document.createElement('img');
                img.className = 'picviewer-img transition';
                img.src = src;
                can.appendChild(img);
                this.index = index;
                this.image.rotate = 0;
                this.initImage(img, con.showtime++ === 0);
            }
        },
        close: function() {
            this.isShow = false;
            this.container.showtime = 0;
            this.container.isFull && this.exitfull();
        },
        onFullChange: function(event) {
            var me = this,
                con = me.container;
            
            if (con.isFull) {
                me.initImage(me.image.el, true);
            } else {
                con.style = {
                    left: '0px',
                    top: '0px',
                    width: '100%',
                    height: '100%'
                };
                Vue.nextTick(function() {
                    me.zoom(me.image.ratio);
                });
            }
            con.isFull = !con.isFull;
        },
        isMovePic: function() {

            var imgel = this.image.el,
                conel = this.container.el;

            if (imgel.clientHeight > conel.clientHeight || imgel.clientWidth > conel.clientWidth)
                return true;
            else return false;
        },
        initImage: function(img, init) {
            var me = this,
                con = me.container,
                imgData = me.image;

            getImageSize(img, function(naturalWidth, naturalHeight) {

                imgData.naturalWidth = naturalWidth;
                imgData.naturalHeight = naturalHeight;


                //计算容器的宽度
                var width = naturalWidth * 0.8; //默认0.8倍显示图片
                if (width > CON_MAX_WIDTH) width = CON_MAX_WIDTH;
                if (width < CON_MIN_WIDTH) width = CON_MIN_WIDTH;

                //计算图片的缩放比例
                imgData.ratio = width / naturalWidth;

                //计算容器的高度
                var height = naturalHeight * imgData.ratio;
                if (height > CON_MAX_HEIGHT) height = CON_MAX_HEIGHT;
                if (height < CON_MIN_HEIGHT) height = CON_MIN_HEIGHT;

                var css = '';
                if (init) {
                    css = {
                        width: num2px(width),
                        height: num2px(height),
                        left: num2px((window.innerWidth - width) / 2),
                        top: num2px((window.innerHeight - height) / 2)
                    };
                } else if (!con.isFull) {
                    var oriTop = px2num(getStyle(con.el, 'top')),
                        oriLeft = px2num(getStyle(con.el, 'left')),
                        oriWidth = px2num(getStyle(con.el, 'width')),
                        oriHeight = px2num(getStyle(con.el, 'height'));

                    css = {
                        width: num2px(width),
                        height: num2px(height),
                        left: num2px(oriLeft + (oriWidth - width) / 2),
                        top: num2px(oriTop + (oriHeight - height) / 2)
                    };
                }

                me.container.style = css;
                Vue.nextTick(function() {
                    me.zoom(imgData.ratio);
                });

            });
        },
        zoom: function(ratio) {
            var imgData = this.image,
                conel = this.container.el;

            ratio > 5 ? ratio = 5 : (ratio < 0.1 ? ratio = 0.1 : ratio = ratio);

            imgData.ratio = ratio;

            var width = imgData.naturalWidth * ratio,
                height = imgData.naturalHeight * ratio;

            imgData.marginL = (conel.clientWidth - width) / 2;
            imgData.marginT = (conel.clientHeight - height) / 2;


            this.setImgStyle({
                'margin-left': num2px(imgData.marginL),
                'margin-top': num2px(imgData.marginT),
                width: num2px(width),
                height: num2px(height)
            });
        },
        setImgStyle: function(css) {
            for (var key in css) setStyle(this.image.el, key, css[key]);
        },
        rotate: function() {

            var rotate = (this.image.rotate += 90),
                transform = 'rotate(' + rotate + 'deg)';

            this.setImgStyle({
                '-webkit-ransform': transform,
                '-ms-transform': transform,
                'transform': transform
            });
        },
        switchFull: function() {
            this.container.isFull ? this.exitfull() : this.fullscreen();
        },
        fullscreen: function() {
            var el = this.container.el,
                func = el.requestFullscreen ||
                el.msRequestFullscreen ||
                el.mozRequestFullScreen ||
                el.webkitRequestFullScreen;
            if (!!func) {
                func.call(el);
            }
        },
        exitfull: function() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        },
        onMouseDown: function(event) {
            var con = this.container,
                imgData = this.image,
                el = con.el,
                tar = event.target;

            if (tar === imgData.el && (con.isFull || this.isMovePic())) {
                con.action = 'move';

                imgData.el.className = 'picviewer-img move';
                imgData.target = tar;
                imgData.startX = event.pageX;
                imgData.startY = event.pageY;
                imgData.marginL = px2num(getStyle(imgData.el, 'margin-left'));
                imgData.marginT = px2num(getStyle(imgData.el, 'margin-top'));
            } else if (!con.isFull) {
                con.action = 'move';
                imgData.target = null;
                con.rect = con.el.getBoundingClientRect();
                con.startX = event.pageX;
                con.startY = event.pageY;
            } else {
                event.preventDefault();
            }
        },
        onMouseUp: function(event) {
            var con = this.container;
            if (con.action === 'move') {
                con.action = false;
                this.image.el.className = 'picviewer-img transition';
            }
        },
        onMouseMove: function(event) {
            var con = this.container,
                imgData = this.image;

            if (con.action === 'move') {
                event.preventDefault();
                if (imgData.target && (con.isFull || this.isMovePic())) {
                    this.setImgStyle({
                        'margin-left': num2px(event.pageX - imgData.startX + imgData.marginL),
                        'margin-top': num2px(event.pageY - imgData.startY + imgData.marginT)
                    });
                } else if (!con.isFull) {
                    con.style.left = num2px(event.pageX - con.startX + con.rect.left);
                    con.style.top = num2px(event.pageY - con.startY + con.rect.top);
                }
            }
        },
        onWheel: function(e) {
            var me = this;
            var delta = 1;

            // 限制滚动太快
            if (me.wheeling) return;
            me.wheeling = true;
            setTimeout(function() {
                me.wheeling = false;
            }, 50);


            if (e.deltaY) {
                delta = e.deltaY > 0 ? -1 : 1;
            } else if (e.wheelDelta) {
                delta = e.wheelDelta / 120;
            } else if (e.detail) {
                delta = e.detail > 0 ? -1 : 1;
            }
            me.zoom(this.image.ratio + (delta > 0 ? 0.1 : -0.1));
        }
    },
    mounted: function() {
        this.container.el = this.$el;
    },
    created: function() {
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    },
    destroyed: function() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}
