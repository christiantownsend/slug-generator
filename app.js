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
            console.log(diff)
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
})

var app = new Vue({
    el: '#app',
    data: {
        color: '#fff',
        bgcolor: '#000',
        slug: [25, 25, 25, 25],
        club: [25, 25, 25, 25]
    },
    methods: {
        setColors: function (dark, light, inverted) {
            var r = document.querySelector(':root');

            r.style.setProperty('--dark-color', dark);
            r.style.setProperty('--light-color', light);

            if (inverted) {
                r.style.setProperty('--main-color', 'var(--dark-color)');
                r.style.setProperty('--bg-color', 'var(--light-color)');
                this.color = dark;
                this.bgcolor = light;
            }
            else {
                r.style.setProperty('--main-color', 'var(--light-color)');
                r.style.setProperty('--bg-color', 'var(--dark-color)');
                this.color = light;
                this.bgcolor = dark;
            }
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
        genSVG: async function () {
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            // const reader = new FileReader()
            const font_data = await fetchAsDataURL("./SLUGVariableVF.ttf");
            // const font_data = "SLUGVariableVF.ttf";
            const style = document.createElementNS(svgNS, "style");
            style.textContent = `@font-face {
                font-family: 'SLUG';
                src: url(${font_data}) format('truetype'); 
            }`;
            svg.append(style);

            const foreignObject = document.createElementNS(svgNS, "foreignObject");
            foreignObject.setAttribute("x", 0);
            foreignObject.setAttribute("y", 0);

            const target = document.querySelector(".target");
            const clone = cloneWithStyles(target);
            foreignObject.append(clone);

            const {
                width,
                height
            } = target.getBoundingClientRect();
            foreignObject.setAttribute("width", width);
            foreignObject.setAttribute("height", height);
            svg.setAttribute("width", width);
            svg.setAttribute("height", height);

            svg.append(foreignObject);

            const svg_markup = new XMLSerializer().serializeToString(svg);
            const svg_file = new Blob([svg_markup], {
                type: "image/svg+xml"
            });

            const img = new Image();

            img.crossOrigin = 'Anonymous';
            img.src = URL.createObjectURL(svg_file);
            await img.decode();
            URL.revokeObjectURL(img.src);

            const canvas = document.createElement("canvas");
            canvas.setAttribute("class", "thumbnail");
            const scale = 10;
            Object.assign(canvas, { width: width * scale, height: height * scale });
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const thumbgrid = document.querySelector(".thumbnail-grid")

            thumbgrid.appendChild(canvas);
            // downloadImage(canvas.toDataURL('image/png'), 'slug-club-wordmark-variation.png')
        },
        genSVG2: function() {

            let slug = this.slug
            let connector = [' ']
            let club = this.club

            let weights = slug.concat(connector).concat(club).map(x => x * 14.39);

            console.log(weights);

            generateSVG(weights, this.color, this.bgcolor);
        }
    }
})

function downloadImage(data, filename = 'untitled.jpeg') {
    var a = document.createElement('a');
    a.href = data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
}

function fetchAsDataURL(url) {
    return fetch(url)
        .then((resp) => resp.ok && resp.blob())
        .then((blob) => new Promise((res) => {
            const reader = new FileReader();
            reader.onload = (evt) => res(reader.result);
            reader.readAsDataURL(blob);
        }));
}

function cloneWithStyles(source) {
    const clone = source.cloneNode(true);
    const source_walker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT, null);
    const clone_walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT, null);
    let source_element = source_walker.currentNode;
    let clone_element = clone_walker.currentNode;
    while (source_element) {

        const source_styles = getComputedStyle(source_element);
        const clone_styles = getComputedStyle(clone_element);
        // not sure why but Chrome doesn't make these keys enumerable...
        // so we have to add it ourselves
        const style_keys = [...source_styles].concat(
            ["font-variation-settings", "font-optical-sizing", "font-synthesis"]
        );
        for (let key of style_keys) {
            if (clone_styles[key] !== source_styles[key]) {
                clone_element.style.setProperty(key, source_styles[key]);
            }
        }

        source_element = source_walker.nextNode()
        clone_element = clone_walker.nextNode()

    }
    return clone;
}

function generateSVG(widths, color, bgcolor) {
    const fontUrl = "./SLUGVariableVF.ttf";
    const slugString = "SLUG\nCLUB";

    console.log(color);

    fetch(fontUrl).then(res => res.arrayBuffer()).then(ab => {
        const font = fontkit.create(new Buffer(ab));

        // let fontVariation = font.getVariation({ 'wdth': 1139 });

        wordmarkGlyphs = [];

        for (let i = 0; i < slugString.length; i++) {

            let randomWidth = Math.random() * 1139;

            let fontVariation = font.getVariation({ 'wdth': widths[i] });

            let run = fontVariation.layout(slugString[i]);

            wordmarkGlyphs.push(run);
        }

        console.log(wordmarkGlyphs);


        let wordmarkSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wordmarkSVG.setAttribute('height', 300);
        wordmarkSVG.setAttribute('width', 425);

        let wordmarkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        wordmarkGroup.setAttribute('transform', 'scale(1 -1)');
        wordmarkGroup.setAttribute('transform-origin', 'top left');

        wordmarkSVG.appendChild(wordmarkGroup);

        let x = 0;
        // let y = 0;
        let y = -1450;

        for (let i = 0; i < wordmarkGlyphs.length; i++) {

            let glyph = wordmarkGlyphs[i].glyphs[0];
            if (glyph.id == 0) {
                y -= 1450;
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

            console.log(glyph.path.toSVG());

            x += pos.xAdvance;
        }

        // wordmarkSVGData = (new XMLSerializer()).serializeToString(wordmarkSVG);
        // console.log(wordmarkSVG);
        

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
        var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

        const image = document.createElement('img');
        image.setAttribute("class", "thumbnail");
        image.setAttribute("style", "background-color: " + bgcolor + ";");
        image.setAttribute("src", url);

        const thumbgrid = document.querySelector(".thumbnail-grid")
        thumbgrid.appendChild(image);

        // return wordmarkSVG;
    });
}