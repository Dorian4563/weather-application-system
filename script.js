const apiKey = 'b9b21bb9f1c3c5918eaa68741e94a57f' //gitleaks:allow
const searchInput = document.getElementById('search-input')
const searchBtn = document.getElementById('search-btn')
const locationBtn = document.getElementById('location-btn')
const weatherDisplay = document.getElementById('weather-display')
const errorDiv = document.getElementById('error')
const recentList = document.getElementById('recent-list')
const themeToggle = document.getElementById('theme-toggle')

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark')
  themeToggle.textContent = document.body.classList.contains('dark')
    ? '☀️ Light Mode'
    : '🌙 Dark Mode'
})

const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || []
updateRecentSearches()

const cachedWeather = localStorage.getItem('cachedWeather')
if (cachedWeather) displayWeather(JSON.parse(cachedWeather))

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords
    await fetchWeather(`lat=${latitude}&lon=${longitude}`, 'auto')
  })
}

searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim()
  if (query) {
    await fetchWeather(`q=${query}`)
    addToRecent(query)
  }
})

async function fetchWeather (query, isAuto = false) {
  try {
    errorDiv.style.display = 'none'
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`
    )
    if (!response.ok) throw new Error('Location not found')
    const current = await response.json()

    const forecastResponse = await fetch(
`https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${apiKey}&units=metric`
    )
    if (!forecastResponse.ok) throw new Error('Forecast unavailable')
    const forecast = await forecastResponse.json()

    const weatherData = { current, forecast, isAuto }
    localStorage.setItem('cachedWeather', JSON.stringify(weatherData))
    displayWeather(weatherData)
  } catch (error) {
    showError(
      error.message === 'Failed to fetch'
        ? 'No internet connection'
        : error.message
    )
  }
}

function displayWeather (data) {
  const { current, forecast, isAuto } = data
  weatherDisplay.style.display = 'block'

  document.getElementById('location').textContent = isAuto
    ? 'Your Location'
    : `${current.name}, ${current.sys.country}`
  document.getElementById('temp').textContent =
    `${Math.round(current.main.temp)}°C`
  document.getElementById('condition').textContent =
    current.weather[0].description
  document.getElementById('icon').src =
    `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`
  document.getElementById('humidity').textContent = `${current.main.humidity}%`
  document.getElementById('wind').textContent = `${current.wind.speed} km/h`
  document.getElementById('timezone').textContent =
    `UTC${current.timezone / 3600 > 0 ? '+' : ''}${current.timezone / 3600}`

  const forecastGrid = document.getElementById('forecast-grid')
  forecastGrid.innerHTML = ''
  const daily = {}
  forecast.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString()
    if (!daily[date]) daily[date] = { temps: [] }
    daily[date].temps.push(item.main.temp)
    if (!daily[date].icon) daily[date].icon = item.weather[0].icon
  })
  Object.keys(daily)
    .slice(0, 5)
    .forEach((date) => {
      const temps = daily[date].temps
      const high = Math.max(...temps)
      const low = Math.min(...temps)
      forecastGrid.innerHTML += `
                    <div class='forecast-day'>
                        <div>${date.split('')[0]}</div>
                        <img src='https://openweathermap.org/img/wn/${daily[date].icon}.png' alt='Icon'>
                        <div>${Math.round(high)}°/${Math.round(low)}°</div>
                    </div>
                `
    })
}

function showError (message) {
  errorDiv.textContent = message
  errorDiv.style.display = 'block'
  weatherDisplay.style.display = 'none'
}

function addToRecent (query) {
  if (!recentSearches.includes(query)) {
    recentSearches.unshift(query)
    if (recentSearches.length > 5) recentSearches.pop()
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches))
    updateRecentSearches()
  }
}

function updateRecentSearches () {
  recentList.innerHTML = ''
  recentSearches.forEach((search) => {
    const li = document.createElement('li')
    li.textContent = search
    li.addEventListener('click', () => {
      searchInput.value = search
      searchBtn.click()
    })
    recentList.appendChild(li)
  })
}
