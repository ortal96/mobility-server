import { Request, Response } from 'express';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dataPath = path.join(__dirname, 'data/data.json');

const app = express();
const PORT = 3000;

app.use('/images', express.static(path.join(__dirname, 'images')));


app.use(cors());
app.use(bodyParser.json());

const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read data:', error);
    return { users: [] };
  }
};

function writeData(data: any): void {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing data:', error);
    throw new Error('Failed to write data');
  }
}

router.get('/users', (req: Request, res: Response) => {
  const data = readData();
  const users = data.users;
  res.json(users);

})

router.get('/user/:id', (req: Request, res: Response) => {
  const data = readData();
  const userId = parseInt(req.params.id);
  const user = data.users.find((u: any) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User does not exist' });
  }

  const prod = getProdForUser(userId);
  res.json({'products' : prod , 'user' : user});
});

const getProdForUser = (user_id: number) => {
  const data = readData();
  const prod = data.user_products.filter((prod: any) => prod.user_id === user_id);
  const prodIdsArray = prod.map((p: any) => p.prod_id)
  const prodDetails = getProdDetails(prodIdsArray, data.products)
  
  let productDetails = prod.map((obj: any , index: any) => ({
    ...obj,
    name: prodDetails[index]?.name,
    price: prodDetails[index]?.price,
    img: `http://localhost:3000/images/${prodDetails[index]?.img}`
    
  }));
  

  return (productDetails)
}

router.get('/address/:city_id/:street_id', (req: Request, res: Response) => {
  const data = readData();
  
  const city = data.cityies.find((c : any) => c.id == req.params.city_id).city_name;
  const street = data.streets.find((s : any) => s.id == req.params.street_id).street_name;
  res.json({'city_name' : city, 'street_name' : street});
});

router.get('/cities', (req: Request , res:Response) => {
  const data = readData();
  const cityies = data.cityies;
  res.json(cityies);
})

router.post('/edit_address', (req: Request , res:Response) => {

  const { id , city_id , street_id , number } = req.body;

  let data = readData();
  const user = data.users;

  let userToEdit = user.find((u : any) => u.id == id)

  if (!userToEdit) {
    return res.status(404).json({ message: 'user not found' });
  }

  userToEdit.city_id = city_id;
  userToEdit.street_id = street_id;
  userToEdit.number = number;

  writeData(data);

  res.status(200).json({ message: 'Address updated successfully', user: userToEdit });

})

router.get('/street/:city_id' , (req: Request, res: Response) => {
  let data = readData();
  let newStreets = data.streets.filter((s: any) => s.city_id == req.params.city_id )

  res.json(newStreets)
})


const getProdDetails = (prodIdArry : Array<number>, products : Array<any>) => {
  const filteredProducts = products.filter(product => prodIdArry.includes(product.id));
  return filteredProducts

}

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});



