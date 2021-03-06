const wordReferenceApi = require("wordreference-api");
const fs = require("fs");
const {
  LANGUAGE_FROM,
  LANGUAGE_TO,
  NO_RESULTS_FILE,
  OUTPUT_FILE
} = require("./constants");

class WordReferenceUtils {
  static createBatches(data) {
    let batches = [];
    while (data.length > 0) {
      batches.push(data.splice(0, 15));
    }
    return batches;
  }
  static determineIfFinishedProcessing(currentBatch, batches) {
    if (currentBatch >= batches.length - 1) {
      console.log("Done translating! Data available in output.csv");
      return true;
    }
    return false;
  }
  static formatTranslations(translations) {
    return translations
      .map(t => t.translations)
      .slice(0, 2)
      .map(t => t[0])
      .map(t => t.to.trim())
      .join(", ");
  }
  static async fetchData({ line, sourceLanguage = LANGUAGE_FROM, targetLanguage = LANGUAGE_TO, outputFile = OUTPUT_FILE, noResultsFile = NO_RESULTS_FILE }) {
    if(!fs.existsSync(outputFile) || !fs.existsSync(noResultsFile)) {
      console.error('Must enter valid output file and no results file!');
      return;
    }
    const hint = `(${line[0]})`;
    const response = await wordReferenceApi(
      encodeURI(line.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
      sourceLanguage,
      targetLanguage
    ).then(result => {
      const { translations } = result;

      if (translations.length === 0) {
        console.error(`No translations found for word: ${line}`);
        fs.appendFile(noResultsFile, `; ${line} \n`, () => {});
        return;
      }

      const firstTwoResults = WordReferenceUtils.formatTranslations(
        translations
      );

      const dataToAppend = `${Array.from(
        new Set(firstTwoResults.split(", "))
      ).join("/")}${hint}; ${line}  \n`;

      fs.appendFile(outputFile, dataToAppend, () => {});
    });
    return response;
  }
  static formatLines(data) {
    return data
      .split(";")
      .map(line => line.replace("/n", "").trim())
      .filter(line => line && line.length);
  }
}

module.exports = {
  WordReferenceUtils
};
