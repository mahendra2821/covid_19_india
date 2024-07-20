const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (Request, Response) => {
  const getStateeQuery = `select * from state order by state_id;`
  const stateArray = await db.all(getStateeQuery)
  Response.send(
    stateArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

//mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

app.get('/states/:stateId/', async (Request, Response) => {
  const {stateId} = Request.params
  const getStateeQuery = `select * from state where state_id = ${stateId};`
  const stateArray = await db.get(getStateeQuery)
  Response.send(convertStateDbObjectToResponseObject(stateArray))
})

//mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

app.post('/districts/', async (Request, Response) => {
  const {districtName, stateId, cases, cured, active, deaths} = Request.body
  const getStateeQuery = `insert into district (district_name, state_id, cases, cured, active, deaths)
  values 
  ('${districtName}' , ${stateId} , ${cases} , ${cured} , ${active} , ${deaths}
  );`
  await db.run(getStateeQuery)
  Response.send('District Successfully Added')
})
///bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

app.get('/districts/:districtId/', async (Request, Response) => {
  const {districtId} = Request.params
  const getStateeQuery = `select * from district where district_id = ${districtId};`
  const stateArray1 = await db.get(getStateeQuery)
  Response.send(stateArray1)
})

//mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

app.delete('/districts/:districtId/', async (Request, Response) => {
  const {districtId} = Request.params
  const getStateeQuery = `
  delete from district where district_id = ${districtId};`
  await db.run(getStateeQuery)
  Response.send('District Removed')
})

///mbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

app.put('/districts/:districtId/', async (Request, Response) => {
  const {districtId} = Request.params
  const detailsQuery = Request.body
  const {districtName, stateId, cases, cured, active, deaths} = detailsQuery
  const updateQuery = `
  update district set district_name = ${districtName},
  state_id = ${stateId},
  cases = '${cases}',
  cured = '${cured}',
  active = '${active}',
  deaths = '${deaths}'
  where 
  district_id = ${districtId};`
  await db.run(updateQuery)
  Response.send('District Details Updated')
})

///mbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

app.get('/states/:stateId/stats/', async (Request, Response) => {
  const {stateId} = Request.params
  const getStateeQuery = `
  select 
  SUM(cases) as totalCases,
  SUM(cured) as totalCured,
  SUM(active) as totalActive,
  SUM(deaths) as totalDeaths
  from district
  where
  state_id = ${stateId};`
  const stateArray1 = await db.get(getStateeQuery)
  Response.send(stateArray1)
})

module.exports = app
