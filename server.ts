import { of, map, interval, concatMap, take, switchMap } from 'rxjs';
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.get('/', (req, res, next) => {
    let data = interval(1000).pipe(
        switchMap(()=>of(1, 2, 3, 4, 5)),
        take(5)
    )
    data.subscribe({
        next: (value) => {
            console.log(`Received value: ${value}`);
            res.write(JSON.stringify(value));
        },
        error: (error) => {
            console.error(`Error: ${error}`);
        },
        complete: () => {
            console.log('Request processed');
            res.end('finally');
        }
    })
})

app.post('/login/', (req, res, next)=>{
    console.log('Received POST request')
})
app.listen(port, ()=>console.log('listening on port' + port))