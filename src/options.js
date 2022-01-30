const attributeNamePrefix = "__";
const ignoreAttributes = false;

module.exports = {
    parserOptions: {
        ignoreAttributes,
        attributeNamePrefix,
    },
    builderOptions: {
        ignoreAttributes,
        format: true,
        attributeNamePrefix,
    },
}