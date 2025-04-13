const notFound = (req, res) =>
  res.status(404).send("Could not find this route.");

module.exports = notFound;
