Vue.component('sliders', {
    template: `
  	<div class="sliders">
    	<input
      	v-for="slider, i in sliders"
        v-model.number="sliders[i]"
        type="range"
        @input="input(i)"
        step="0.01"
        min="0"
        max="79.2"
      >
    </div>
  `,
    model: {
        prop: 'sliders'
    },
    props: {
        sliders: { type: Array, required: true }
    },
    methods: {
        input(n) {
            const sum = this.sliders.reduce((sum, val) => sum + val, 0)
            /* const sum = 1440; */
            const diff = sum - 100
            let remainder = 0
            // console.log(diff)
            for (let i in this.sliders) {
                if (i != n) { //don't modify the slider which is being dragged
                    let val = this.sliders[i] - diff / (this.sliders.length - 1)
                    if (val < 0) {
                        remainder += val
                        val = 0
                    }
                    this.$set(this.sliders, i, val)
                }
            }
            if (remainder) {
                const filteredLength = this.sliders.filter((val, key) => val > 0 && key != n).length
                for (let i in this.sliders) {
                    if (i != n && this.sliders[i] > 0) {
                        this.$set(this.sliders, i, this.sliders[i] + remainder / filteredLength)
                    }
                }
            }
            this.$emit('input', this.sliders)
        }
    }
});

Vue.component('color-selector', {
    template: `
    <button class="color-selector" :style="'--fgColor: ' + fg + '; --bgColor: ' + bg + ';'" @click="setColors(fg, bg)"></button>
    `,
    props: ['fg', 'bg'],
    methods: {
        setColors: function(fg, bg) {
            this.$root.setColors(fg, bg);
        }
    }
});

var app = new Vue({
    el: '#app',
    data: {
        color: '#000',
        bgcolor: '#fff',
        slug: [25, 25, 25, 25],
        club: [25, 25, 25, 25],
        currentSVG: undefined,
    },
    computed: {
        weights: function() {
            let slug = this.slug
            let connector = [' ']
            let club = this.club

            return slug.concat(connector).concat(club).map(x => x * 14.39);
        }
    },
    watch: {
        weights: function() {
            // this.createSVG(this.weights, this.color).then((data) => {this.currentSVG = data;})
            this.updateSVG();
        },
        color: function() {
            this.updateSVG();
        }
    },
    created: function() {
        this.slug = [25, 25, 25, 25];
        this.club = [25, 25, 25, 25];
    },
    methods: {
        setColors: function (fg, bg) {
            var r = document.querySelector(':root');

            r.style.setProperty('--fg-color', fg);
            r.style.setProperty('--bg-color', bg);
            this.color = fg;
            this.bgcolor = bg;
        },
        randomizeWeights: function () {

            var randomWeight = [];
            var sum = 0;

            for (var i = 0; i < this.slug.length; i++) {
                var random = Math.random()
                randomWeight[i] = random;
                sum += random;
            }

            for (var i = 0; i < randomWeight.length; i++) {
                this.$set(this.slug, i, randomWeight[i] / sum * 100);
            }

            sum = 0;

            for (var i = 0; i < this.club.length; i++) {
                var random = Math.random()
                randomWeight[i] = random;
                sum += random;
            }

            for (var i = 0; i < randomWeight.length; i++) {
                this.$set(this.club, i, randomWeight[i] / sum * 100);
            }

            // console.log(this.slug);
        },
        createThumbnail: function() {
            const image = document.createElement('img');
            // image.setAttribute("class", "thumbnail");
            image.setAttribute("src", this.currentSVG);
            image.setAttribute("alt", "slug-club-wordmark");

            const downloadLink = document.createElement('a');
            // downloadLink.setAttribute('class', 'thumbnail');
            downloadLink.setAttribute('href', this.currentSVG);
            downloadLink.setAttribute("class", "thumbnail");
            downloadLink.setAttribute("style", "--bgColor: " + this.bgcolor + "; --fgColor: " + this.color + ";");
            downloadLink.setAttribute('download', 'slug-club-wordmark.svg');

            downloadLink.appendChild(image);

            const thumbgrid = document.querySelector(".thumbnail-grid")
            thumbgrid.appendChild(downloadLink);
        },
        createSVG: async function(widths, color) {
            const fontUrl = "./static/SLUGVariableVF.ttf";
            const slugString = "SLUG\nCLUB";
        
            return fetch(fontUrl).then(res => res.arrayBuffer()).then(ab => {
                const font = fontkit.create(new Buffer(ab));
        
                wordmarkGlyphs = [];
        
                for (let i = 0; i < slugString.length; i++) {
        
                    let randomWidth = Math.random() * 1139;
        
                    let fontVariation = font.getVariation({ 'wdth': widths[i] });
        
                    let run = fontVariation.layout(slugString[i]);
        
                    wordmarkGlyphs.push(run);
                }
        
                let wordmarkSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                wordmarkSVG.setAttribute('height', 300);
                wordmarkSVG.setAttribute('width', 425);
        
                let wordmarkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                wordmarkGroup.setAttribute('transform', 'scale(1 -1)');
                wordmarkGroup.setAttribute('transform-origin', 'top left');
        
                wordmarkSVG.appendChild(wordmarkGroup);
        
                let x = 0;
                let y = -1468;
        
                for (let i = 0; i < wordmarkGlyphs.length; i++) {
        
                    let glyph = wordmarkGlyphs[i].glyphs[0];
                    if (glyph.id == 0) {
                        y -= 1468;
                        // y = 0;
                        x = 0;
                        continue;
                    }
                    let pos = wordmarkGlyphs[i].positions[0];
        
                    let glyphPath = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'path'
                    );
        
                    glyphPath.setAttribute('fill', color);
                    glyphPath.setAttribute('transform', 'translate(' + x / 10 + ' ' + y / 10 + '), scale(.1) ');
                    // glyphPath.setAttribute('x', x);
                    glyphPath.setAttribute(
                        'd',
                        glyph.path.toSVG()
                    );
        
                    wordmarkGroup.appendChild(glyphPath);
        
                    x += pos.xAdvance;
                }
                
        
                //get svg source.
                var serializer = new XMLSerializer();
                var source = serializer.serializeToString(wordmarkSVG);
        
                //add name spaces.
                if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
                }
                if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
                    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
                }
        
                //add xml declaration
                source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        
                //convert svg source to URI data scheme.
                data = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
        
                return data;
            })
        },
        updateSVG: function() {
            let svg = this.createSVG(this.weights, this.color)
            svg.then((data) => {
                this.currentSVG = data;
            });
        },
    }
})