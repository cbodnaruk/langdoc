export class Morpheme {
    form;
    gloss;
    pos;
    binding;
    variations = [];
    allomorphs = [];
    notes;
    id;
    lexical;
    constructor(parameters) {
        this.id = parameters.id;
        this.form = parameters.form;
        this.gloss = parameters.gloss;
        this.pos = parameters.pos;
        this.variations = parameters.variations ?? []; // array of varietal forms and their varieties
        // prefix, suffix etc
        this.binding = parameters.binding ?? "free";
        this.notes = parameters.notes ?? '';
        this.allomorphs = parameters.allomorphs ?? []; // array of allomorphs
        this.lexical = parameters.lexical ?? false; // true if this is a lexical morpheme
        
    }
}

export class Allomorph {
    form;
    notes = '';
    id;
    constructor(id, form){
        this.id = id
        this.form = form
    }
}

export class Variation {
    form;
    allomorphs = [];
    variety;
    constructor(params) {
        this.form = params.form;
        this.allomorphs = params.allomorphs ?? [];
        this.variety = params.variety;
    }
}

export class Word {
    form;
    morphs = [];
    constructor(form){
        this.form = form
        let split = form.split('-')
        for (let i in split){
            this.morphs.push(new Morph(split[i]))
        }
    }
}

export class Morph {
    form;
    id;
    constructor(form){
        this.form = form
    }
}

export class Line {
    words = [];
    line;
    speaker;
    translation;
    timestamp;
    variety;
    duration;
    constructor(parameters){
        this.speaker = parameters.speaker;
        this.translation = parameters.translation;
        let split = parameters.line.split(' ')
        for (let i of split){
            if (i != "") this.words.push(new Word(i))
        }
        this.line = parameters.line
        this.timestamp = parameters.timestamp
        this.duration = parseInt(parameters.duration) ?? 10
        this.variety = parameters.variety ?? "default"
    }
}

export class ClipboardFormat {
    formatter;
    type;
    constructor(formatter, type){
        this.formatter = formatter;
        this.type = type;
    }
}

export function getElementIndex (element) {
    return [...element.parentNode.children].indexOf(element);
  }
