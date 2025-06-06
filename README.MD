# Install locally!

0. npm install
1. install docker
2. in terminal run command -> docker run -d -p 27017:27017 --name eis-db mongo
3. update env file
4. npm run dev

##

Create object in db
` 
  db.users.insertOne({
   name: "Владислав",
   email: "test@gmail.com",
   username: "vlad",
   role: "Admin",
   password: "$2b$04$OgyjiOvXue6XjQhwVCmb9uy1TLb31YIKGTJOVabg81aXZUwKBlAEO",
   phone: "+77051085398",
 });
 `
