exports.export = function(){
    // Create CLDF structure
    const cldfData = {
        "conformsTo": "http://cldf.clld.org/v1.0/terms.rdf#TextCorpus",
        "tables": [
            {
                "url": "texts.csv",
                "tableSchema": {
                    "columns": [
                        {
                            "name": "ID",
                            "datatype": "string"
                        },
                        {
                            "name": "Text",
                            "datatype": "string"
                        },
                        {
                            "name": "Translation",
                            "datatype": "string" 
                        },
                        {
                            "name": "Speaker",
                            "datatype": "string"
                        },
                        {
                            "name": "Timestamp",
                            "datatype": "string"
                        }
                    ]
                }
            }
        ]
    }

    // Convert openData to CLDF format
    const textData = openData.body.map((line, index) => {
        return {
            "ID": index.toString(),
            "Text": line.line,
            "Translation": line.translation,
            "Speaker": line.speaker,
            "Timestamp": line.timestamp
        }
    })

    // Save metadata
    const savePath = dialog.showSaveDialogSync({
        title: "Export CLDF",
        defaultPath: "cldf-metadata.json"
    })

    if (savePath) {
        const dir = path.dirname(savePath)
        
        // Write metadata file
        fs.writeFile(savePath, JSON.stringify(cldfData, null, 2))
            .then(() => {
                // Write texts data
                return fs.writeFile(path.join(dir, 'texts.csv'), 
                    textData.map(row => 
                        `${row.ID},${row.Text},${row.Translation},${row.Speaker},${row.Timestamp}`
                    ).join('\n')
                )
            })
            .catch(err => {
                dialog.showErrorBox('Export Error', 'Failed to export CLDF: ' + err.message)
            })
    }
}