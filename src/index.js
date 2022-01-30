const { XMLParser, XMLBuilder } = require("fast-xml-parser");
const fs = require("fs");
const { parserOptions, builderOptions } = require("./options");
const { arcadeDescriptions } = require('./arcade-descriptions');

// command line arguments in the form on env vars
// fbneo romset, with a mixed back of parents and clones
const sourceRoms = process.env.ROMS_IN || '/media/andrea/SSD 870QVO 2TB/[roms] fbneo 1.0.0.2/arcade/';
// mame snap project, with all screenshots of games
const sourcePng = process.env.PNG_IN || '/media/andrea/SSD 870QVO 2TB/[MAME] SNAPS/snap/';
// destination folder for output of the parent only set, gamelist.xml, images
const destinationRoms = process.env.ROMS_OUT || '/media/andrea/SSD 870QVO 2TB/[roms] recalbox-fbneo/';

const withCopies = false;

console.log(`
    roms: ${sourceRoms},
    png: ${sourcePng},
    destination: ${destinationRoms},
`)

// this file can be found in /share/bios/fbneo of the recalbox distribution
const romsInfo = fs.readFileSync("./FinalBurn Neo (ClrMame Pro XML, Arcade only).dat");

const parser = new XMLParser(parserOptions);
const roms = parser.parse(romsInfo)?.datafile;

if (!roms) {
    console.log('Data format was not as expected. `datafile` entry missing.');
}

const parentGames = roms.game
// remove the clone/split sets
.filter((game) => !(game.__cloneof || game.__romof))
// create the correct data format
.map((parent) => {
    /*
     *
     *  {
     *      path: '3countb.zip',
     *      hash: 'E59385A9',
     *      region: 11,
     *      genreid: 262,
     *      genre: 'Fight',
     *      publisher: 'SNK',
     *      developer: 'SNK',
     *      releasedate: '19921231T230000',
     *      video: 'media/videos/3 Count Bout .',
     *      thumbnail: 'media/thumbnails/3 Count Bout .',
     *      image: 'media/images/3 Count Bout 7aef94a55a14c229ff8be776ba1d5a26.png',
     *      desc: "3 Count Bout is a one-on-one fighting game. Choose from ten wrestlers who have their own power attacks. There are ten rounds in the game, and each one of them has you fighting other wrestlers that are much tougher than the previous ones. You defeat each one by biting, kicking, and performing other moves to the point where their damage meter is empty. But just because it is empty doesn't mean that you win. You have to pin him for the infamous-three count. Also features competitive play and tag match battles.",
     *      rating: 0.6,
     *      name: '3countb'
     *  }
     * 
     */
    const romName = parent.__name;
    const description = arcadeDescriptions[romName];
    const imageFile = `${sourcePng}${romName}.png`;
    const doesImageExist = fs.existsSync(imageFile);
    const destinationImage = `media/images/${romName}.png`;
    if (withCopies) {
        if (doesImageExist) {
            fs.copyFileSync(imageFile, `${destinationRoms}${destinationImage}`);
        }
        fs.copyFileSync(`${sourceRoms}${romName}.zip`, `${destinationRoms}${romName}.zip`);
    }
    return {
        path: `${parent.__name}.zip`,
        publisher: parent.manufacturer,
        developer: parent.manufacturer,
        releasedate: parent.year.toString(),
        desc: description || parent.description,
        ...(doesImageExist ? { image: destinationImage } : {}),
        name: parent.description,
    }
})

const template = fs.readFileSync("./gamelist-template.xml");
const gamelist = parser.parse(template);

const builder = new XMLBuilder(builderOptions);
// swap game list in template
gamelist.gameList.game = parentGames;

const xmlString = builder.build(gamelist);
fs.writeFileSync(`${destinationRoms}gamelist.xml`, xmlString, { encoding: 'utf-8' });