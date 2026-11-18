export class User {
    constructor({
        id,
        name,
        lastName,
        email,
        password,
        roleId,
        lastLogin,
        createdAt
    } = {}) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.roleId = roleId;
        this.lastLogin = lastLogin;
        this.createdAt = createdAt;
    }
}