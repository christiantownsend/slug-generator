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
        slug: [25, 25, 25, 25],
        club: [25, 25, 25, 25]
    },
    methods: {
        randomizeWeights: function() {

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
            Object.assign(canvas, { width: width*scale, height: height*scale });
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const thumbgrid = document.querySelector(".thumbnail-grid")

            thumbgrid.appendChild( canvas );
            // downloadImage(canvas.toDataURL('image/png'), 'slug-club-wordmark-variation.png')
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
