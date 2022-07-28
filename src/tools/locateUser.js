module.exports = (customers, id) => {
  for (let i = 0; i < customers.length; i++) {
    if (id == customers[i].id) {
      return customers[i];
    }
  }
  return null;
};
