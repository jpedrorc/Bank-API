module.exports = (costumers, id) => {
  for (let i = 0; i < costumers.length; i++) {
    if (id == costumers[i].id) {
      return costumers[i];
    }
  }
  return null;
};
