const format = {
    header: {
         //read from EAF, but ELAN only allows miliseconds so it should always be the same
        timeUnits: 'milliseconds',
         // full date string incl time and timezone
        date: '',
        // array of objects representing linked media files
        media: [
            {
                // url to media file
                url: '',
                // mime type of media file
                mimetype: '',
                // time origin (for synchronisation) of media file
                timeOrigin: ''
            }
        ]
    },
    // array of Line objects representing lines of text, instances of Line class
    body: [
        {
            // line of text
            line: '',
            // translation of line
            translation: '',
            // speaker of line
            speaker: '',
            // timestamp of line
            timestamp: '',
            // [opt] duration of line
            duration: '',
            // array of words
            words: [
                {
                    // word form
                    form: '',
                    // array of morphemes
                    morphs: [
                        {
                            // morpheme form
                            form: '',
                            // [opt] id of meaning in project dictionary
                            id: ''
                        }
                    ]
                }
        }
    ]
}