# Language Documentation Tool
As yet unnamed (_langdoc_? _lingbook_? _plexiglass_?), a cross-platform alternative to FLEx which solves what I see are some of its issues. A fast, easy to use tool to assist in data analysis and management in the field.
### Goals:
#### Greater interoperability
Simpler integration with ELAN, CLDF data, and laMETA. Simpler exporting of examples and data for inclusion in articles, whether in Word or LaTeX.

#### Cross-platform
Built on the natively cross-plaform Electron framework, so Mac or Linux users don't need to use a virtual machine.

#### No bloat
No extra features slowing that rarely get used by linguists in the field

#### Filling in feature gaps
Filling in gaps in functionality such as audio/video snippets, support for multiple language varieties

## Getting Started

### Development Dependencies
You will need to have

* [NodeJS](https://nodejs.org/) version 20 or later.

* [NPM package manager](
      https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  version 9 or later.

### Installing packages
Use NPM to install all the necessary packages
```
$ npm install
```

### Starting the development version
```
$ npm run start
```

### Dummy data
Currently the repo has some test data included. The texts are imported from ELAN, and the dictionary was created inside the program. This is just test data.

## Contributing
The program is structured as follows:
* Electron programs are functionally a web server and web app in one, built using various web frameworks
* Scripts used for "server-side" functionality (namely, parsers for file conversion, among some others) are in ```./local_modules```
* Scripts used for "client-side" functionality (all UI interaction, probably too much actual data handling) are in ```./scripts```

### Scripts
There are three important "client-side" scripts, ```classes.js```, ```components.js```, and ```core.js```. 

* ```classes.js``` defines the data structures used for handling linguistic data.
* ```components.js``` provides functions which return commonly used UI components, to make reusing them simpler. I could have REACT for this but I decided not to.
* ```core.js``` contains script that is needed for more basic functions, and not by a particular module.

Beyond these three, the scripts cover specific parts and functionalities in the app, and ```dev.js``` adds a handler that opens the inspect window on right click.

