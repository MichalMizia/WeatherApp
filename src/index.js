// options for geoDB cities API
const options = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '2149f7d5c1msh8ee09957bd1cc70p1b7b8cjsn5bf7548f279b',
		'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
	}
};

// usefull stuff from the DOM
const search = document.getElementById('citySearch')
const matchList = document.getElementById('matchList')
const temp = document.getElementById('temp')
const wind = document.getElementById('wind')
const humidity = document.getElementById('humidity')
const weatherSection = document.getElementById('weatherSection')
const background = document.querySelector('.main-weather-section')
const generalInformation = document.getElementById('generalInfo')
const icon = document.querySelector('.icon')
const compassArrow = document.querySelector('.arrow')
const dateToDisplayHtml = document.querySelector('.date')
const appTitle = document.querySelector('.app-title')
dateToDisplayHtml.textContent = (new Date).toLocaleDateString()

const OPENWEATHER_API_KEY = 'fda2b154ed3bb0924854dcd8cdaf7277';
let cities = []

//add an event listener to changes in input
search.addEventListener('input', ()=> debounceSearchMatches(search.value))

//api is limited in request per sec do I had to use debounce
function debounce(func, delay = 1000){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, delay);
    };
}

//search to find the cities matching with the input
const searchMatches = async searchText => {
    const res = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10&minPopulation=10000&namePrefix=${searchText}&sort=population`, options) 
    const resJSON = await res.json();
    const data = resJSON.data;
    //reset the cities
    cities = [];

    data.forEach(dataPoint => {
        //for each city from the list of 20 biggest cities matching the input we create a city object
        const city = {
            cityName: dataPoint.name,
            countryCode: dataPoint.countryCode,
            lat: dataPoint.latitude,
            lon: dataPoint.longitude
        }
        cities.push(city)
    });

    if(searchText.length === 0){
        cities = [];
        matchList.innerHTML = '';
        weatherSection.classList.remove('rotate-in')
        appTitle.classList.remove('hide')
        currentCity = null
    }

    outputHTML(cities);
}

const outputHTML = cities =>{
    matchList.innerHTML = '';
    if(cities.length > 0){
        const html = cities.map(city => 
            `<li>
               <h4>${city.cityName}</h4>
               <p>${city.countryCode}</p>
             </li>`
          ).join('');
      matchList.innerHTML = html;
    }
}

const debounceSearchMatches = debounce((text) =>{
    searchMatches(text)
})

//add an event listener to the list of cities
let currentCity;
matchList.addEventListener('click', (e)=>{
    if(e.target.tagName.toLowerCase()  === 'li'){
        const name = e.target.querySelector('h4').textContent;
        const countryCode = e.target.querySelector('p').textContent;
        index = cities.findIndex(city => city.cityName === name && city.countryCode === countryCode)
    }else if(e.target.tagName.toLowerCase()  === 'h4'){
        const name = e.target.textContent;
        const countryCode = e.target.parentNode.querySelector('p').textContent;
        index = cities.findIndex(city => city.cityName === name && city.countryCode === countryCode)
    }else if(e.target.tagName.toLowerCase()  === 'p'){
        const countryCode = e.target.textContent;
        const name = e.target.parentNode.querySelector('h4').textContent;
        index = cities.findIndex(city => city.cityName === name && city.countryCode === countryCode)
    }
    currentCity = cities[index]
    search.value = `${cities[index].cityName},  ${cities[index].countryCode}`

    getWeather(1, cities[index].lat, cities[index].lon);
    cities = []
    matchList.innerHTML = '';
    prevDescription = null
    //rotate the weather section
    weatherSection.classList.add('rotate-in')
    appTitle.classList.add('hide')
  })

  let currentDate = 1;

  const skipRight = document.getElementById('skipRight')
  const skipLeft = document.getElementById('skipLeft')
  
  skipRight.addEventListener('click', ()=>{
    skipLeft.style.color = 'white'
    if(currentDate === 5) return;
    if(currentDate === 4) skipRight.style.color = '#d5d4d4'

    if(currentCity == null || search.value.length === 0) return
    currentDate += 1;
    getWeather(currentDate, currentCity.lat, currentCity.lon)
  })
  skipLeft.addEventListener('click', ()=>{
    skipRight.style.color = 'white'
    if(currentDate === 1) return;
    if(currentDate === 2) skipLeft.style.color = '#d4d3d3'

    if(currentCity == null || search.value.length === 0) return

    currentDate -= 1;
    getWeather(currentDate, currentCity.lat, currentCity.lon)
  })

  let prevDescription
  async function getWeather(date, lat, lon){
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`)
    const data = await res.json()

    // beacuse the api is set to 3hour intervals and we want the weather after 24 hours
    let index = (date - 1) * 8;
    if(index === 0) index = 1;

    const tempVal = (data.list[index].main.temp - 273.15).toFixed(1);
    const windSpeed = (data.list[index].wind.speed * 3.6).toFixed(1);
    const humidityVal = data.list[index].main.humidity.toFixed(1); 
    compassArrow.style.setProperty('--rotation', data.list[index].wind.deg)
    temp.textContent = `${tempVal} °C`;
    wind.textContent = `${windSpeed} km/h`;
    humidity.textContent = `${humidityVal} %`;
    generalInformation.textContent = data.list[index].weather[0].description;

    const today = Date.now();
    const displayDate = new Date(today);
    displayDate.setDate(displayDate.getDate() + date -1)
    dateToDisplayHtml.textContent = displayDate.toLocaleDateString()
    
    //setting the icon
    const id = data.list[index].weather[0].id
    if(Math.floor(id/100) === 2){
        icon.src = 'http://openweathermap.org/img/wn/11d@2x.png'
    }else if(Math.floor(id/100) === 3){
        icon.src = 'http://openweathermap.org/img/wn/09d@2x.png'
    }else if(id===511){
        icon.src = 'http://openweathermap.org/img/wn/13d@2x.png'
    }else if(id===520 || id===521 || id===522 || id===531){
        icon.src = 'http://openweathermap.org/img/wn/09d@2x.png'
    }else if(Math.floor(id/100) === 5){
        icon.src = 'http://openweathermap.org/img/wn/10d@2x.png'
    }else if(Math.floor(id/100) === 6){
        icon.src = 'http://openweathermap.org/img/wn/13d@2x.png'
    }else if(Math.floor(id/100) === 7){
        icon.src = 'http://openweathermap.org/img/wn/50d@2x.png'
    }else if(id === 800){
        icon.src = 'http://openweathermap.org/img/wn/01d@2x.png'
    }else if(id === 801){
        icon.src = 'http://openweathermap.org/img/wn/02d@2x.png'
    }else if(id === 802){
        icon.src = 'http://openweathermap.org/img/wn/03d@2x.png'
    }else if(id === 803 || id===804){
        icon.src = 'http://openweathermap.org/img/wn/04d@2x.png'
    }

    const description = data.list[index].weather[0].description.replace(' ', '-');
    if(prevDescription === null || prevDescription === undefined){
        prevDescription = 1;
        background.style.backgroundImage = `url('https://source.unsplash.com/random/?weather,${description}')`
    }
  }


  

