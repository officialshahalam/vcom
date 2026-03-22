const userService = require("./user.service");

const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await userService.getUsers(search);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById };
