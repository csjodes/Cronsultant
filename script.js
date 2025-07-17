// Theme management
const themeToggle = document.getElementById("theme-toggle")
const body = document.body
let currentTheme = "solarized-light"

// Updated templates with valid cron expressions
const cronTemplates = [
  { title: "Every Hour", expression: "0 * * * *", description: "At minute 0 of every hour" },
  { title: "Daily at 9 AM", expression: "0 9 * * *", description: "Every day at 9:00 AM" },
  { title: "Weekdays at 9 AM", expression: "0 9 * * 1-5", description: "Monday through Friday at 9:00 AM" },
  { title: "Every 15 Minutes", expression: "*/15 * * * *", description: "Every 15 minutes" },
  { title: "Weekly on Sunday", expression: "0 0 * * 0", description: "Every Sunday at midnight" },
  { title: "Monthly on 1st", expression: "0 0 1 * *", description: "First day of every month at midnight" },
  { title: "Every 6 Hours", expression: "0 */6 * * *", description: "Every 6 hours" },
  { title: "Twice Daily", expression: "0 9,21 * * *", description: "At 9 AM and 9 PM every day" },
]

// Challenges data
const cronChallenges = [
  {
    question: "Write a cron expression that runs every 5 minutes on weekdays",
    answer: "*/5 * * * 1-5",
    hint: "Use step values for minutes and a range for weekdays",
  },
  {
    question: "Create a cron for 2:30 PM every Tuesday",
    answer: "30 14 * * 2",
    hint: "Remember: 2:30 PM is 14:30 in 24-hour format, Tuesday is day 2",
  },
  {
    question: "Schedule a job for the first Monday of every month at 9 AM",
    answer: "0 9 * * 1#1",
    hint: "Use the # symbol for nth occurrence of a weekday",
  },
]

// DOM elements
const timezoneSelector = document.getElementById("timezone-selector")
const copyBtn = document.getElementById("copy-btn")
const templatesGrid = document.getElementById("templates-grid")
const challengesToggle = document.getElementById("challenges-toggle")
const challengesModal = document.getElementById("challenges-modal")
const closeChallenges = document.getElementById("close-challenges")
const aboutLink = document.getElementById("about-link")

// Current state
let currentTimezone = "UTC"
let currentChallenge = 0
let executionsExpanded = false

// Initialize theme - defaults to light mode
function initTheme() {
  const savedTheme = localStorage.getItem("cronsultant-theme") || "solarized-light"
  setTheme(savedTheme)
}

function setTheme(theme) {
  currentTheme = theme
  body.setAttribute("data-theme", theme)
  localStorage.setItem("cronsultant-theme", theme)

  const themeIcon = themeToggle.querySelector(".theme-icon")
  themeIcon.textContent = theme === "solarized-light" ? "🌙" : "☀️"
}

function toggleTheme() {
  const newTheme = currentTheme === "solarized-light" ? "monokai" : "solarized-light"
  setTheme(newTheme)
}

// Custom Cron Execution Calculator
class CronExecutionCalculator {
  constructor() {
    this.timezoneOffsets = {
      UTC: 0,
      "America/New_York": -5, // EST (will adjust for DST)
      "America/Chicago": -6, // CST
      "America/Denver": -7, // MST
      "America/Los_Angeles": -8, // PST
      "Europe/London": 0, // GMT (will adjust for DST)
      "Europe/Paris": 1, // CET
      "Asia/Tokyo": 9, // JST
    }
  }

  parseField(field, min, max) {
    if (field === "*") {
      return Array.from({ length: max - min + 1 }, (_, i) => i + min)
    }

    if (field.includes(",")) {
      return field
        .split(",")
        .map((v) => Number.parseInt(v))
        .filter((v) => v >= min && v <= max)
    }

    if (field.includes("-")) {
      const [start, end] = field.split("-").map((v) => Number.parseInt(v))
      if (start >= min && end <= max && start <= end) {
        return Array.from({ length: end - start + 1 }, (_, i) => i + start)
      }
      return []
    }

    if (field.includes("/")) {
      const [range, step] = field.split("/")
      const stepValue = Number.parseInt(step)
      const values = []

      if (range === "*") {
        for (let i = min; i <= max; i += stepValue) {
          values.push(i)
        }
      } else if (range.includes("-")) {
        const [start, end] = range.split("-").map((v) => Number.parseInt(v))
        for (let i = start; i <= end; i += stepValue) {
          values.push(i)
        }
      }
      return values.filter((v) => v >= min && v <= max)
    }

    const value = Number.parseInt(field)
    return value >= min && value <= max ? [value] : []
  }

  getNextExecutions(cronExpression, count = 5, timezone = "UTC") {
    try {
      const parts = cronExpression.trim().split(/\s+/)
      if (parts.length !== 5) return []

      const [minuteField, hourField, dayField, monthField, weekdayField] = parts

      const minutes = this.parseField(minuteField, 0, 59)
      const hours = this.parseField(hourField, 0, 23)
      const days = this.parseField(dayField, 1, 31)
      const months = this.parseField(monthField, 1, 12)
      const weekdays = this.parseField(weekdayField, 0, 6)

      if (minutes.length === 0 || hours.length === 0 || months.length === 0) {
        return []
      }

      const executions = []
      const now = new Date()
      const startTime = new Date(now.getTime())

      // Adjust for timezone
      const offset = this.timezoneOffsets[timezone] || 0
      startTime.setHours(startTime.getHours() + offset)

      const searchDate = new Date(startTime)
      let attempts = 0
      const maxAttempts = 10000 // Prevent infinite loops

      while (executions.length < count && attempts < maxAttempts) {
        attempts++

        const minute = searchDate.getMinutes()
        const hour = searchDate.getHours()
        const day = searchDate.getDate()
        const month = searchDate.getMonth() + 1
        const weekday = searchDate.getDay()

        const minuteMatch = minutes.includes(minute)
        const hourMatch = hours.includes(hour)
        const dayMatch = days.includes(day) || dayField === "*"
        const monthMatch = months.includes(month)
        const weekdayMatch = weekdays.includes(weekday) || weekdayField === "*"

        // Check if both day and weekday are specified (OR logic)
        const dayWeekdayMatch =
          (dayField === "*" && weekdayField === "*") ||
          (dayField !== "*" && weekdayField === "*" && dayMatch) ||
          (dayField === "*" && weekdayField !== "*" && weekdayMatch) ||
          (dayField !== "*" && weekdayField !== "*" && (dayMatch || weekdayMatch))

        if (minuteMatch && hourMatch && monthMatch && dayWeekdayMatch && searchDate > now) {
          // Convert back to selected timezone for display
          const displayDate = new Date(searchDate.getTime() - offset * 60 * 60 * 1000)
          executions.push(this.formatDateTime(displayDate))
        }

        // Move to next minute
        searchDate.setMinutes(searchDate.getMinutes() + 1)
      }

      return executions
    } catch (error) {
      console.error("Error calculating cron executions:", error)
      return []
    }
  }

  formatDateTime(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day} ${hours}:${minutes}:00`
  }
}

// Cron validation and parsing
class CronParser {
  constructor() {
    this.monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    this.dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  }

  validateField(field, min, max) {
    if (field === "*") return true

    // Check for invalid ranges like "-5" or just "-"
    if (field.includes("-")) {
      const parts = field.split("-")
      if (parts.length !== 2 || parts[0] === "" || parts[1] === "") return false
      const [start, end] = parts.map(Number)
      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) return false
      return true
    }

    if (field.includes("/")) {
      const [range, step] = field.split("/")
      const stepValue = Number.parseInt(step)
      if (isNaN(stepValue) || stepValue < 1) return false
      if (range === "*") return true
      if (range.includes("-")) {
        const [start, end] = range.split("-").map(Number)
        return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end
      }
      return false
    }

    if (field.includes(",")) {
      const values = field.split(",").map(Number)
      return values.every((val) => !isNaN(val) && val >= min && val <= max)
    }

    const num = Number.parseInt(field)
    return !isNaN(num) && num >= min && num <= max
  }

  validate(expression) {
    const parts = expression.trim().split(/\s+/)

    if (parts.length !== 5) {
      return { valid: false, message: "Expression must have exactly 5 fields" }
    }

    const [minute, hour, day, month, weekday] = parts
    const validations = [
      { field: minute, min: 0, max: 59, name: "minute" },
      { field: hour, min: 0, max: 23, name: "hour" },
      { field: day, min: 1, max: 31, name: "day" },
      { field: month, min: 1, max: 12, name: "month" },
      { field: weekday, min: 0, max: 6, name: "weekday" },
    ]

    for (const { field, min, max, name } of validations) {
      if (!this.validateField(field, min, max)) {
        return { valid: false, message: `Invalid ${name} field: ${field}` }
      }
    }

    return { valid: true, parts }
  }

  describe(parts) {
    const [minute, hour, day, month, weekday] = parts

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const pad = (n) => n.toString().padStart(2, "0")
    const isStar = (val) => val === "*"

    const isValidRange = (range, max) => {
      if (!range.includes("-")) return false
      const [start, end] = range.split("-")
      const s = Number.parseInt(start),
        e = Number.parseInt(end)
      return !isNaN(s) && !isNaN(e) && s >= 0 && e <= max && s <= e
    }

    const parseList = (val, names = null, max = 59) => {
      const items = val.split(",")
      for (const item of items) {
        if (item.includes("-") && !isValidRange(item, max)) return null
      }
      return items
        .map((item) => {
          if (item.includes("-")) {
            const [start, end] = item.split("-")
            if (names)
              return `every day-of-week from ${names[Number.parseInt(start)]} through ${names[Number.parseInt(end)]}`
            return `${start} through ${end}`
          } else if (names) {
            return names[Number.parseInt(item)]
          } else {
            return item
          }
        })
        .join(", ")
    }

    let timePart = ""
    let dayPart = ""
    let monthPart = ""
    let weekdayPart = ""

    try {
      // Time part with spans
      if (!isStar(minute) && hour.includes("/")) {
        timePart = `At <span data-field="minute">${minute}</span> past every <span data-field="hour">${hour.split("/")[1]}th</span> hour`
      } else if (!isStar(minute) && hour.includes(",")) {
        timePart = `At <span data-field="minute">${minute}</span> past hour <span data-field="hour">${hour.split(",").join(" and ")}</span>`
      } else if (minute.includes("/") && isStar(hour)) {
        timePart = `At every <span data-field="minute">${minute.split("/")[1]}th</span> minute`
      } else if (!isStar(minute) && !isStar(hour)) {
        timePart = `At <span data-field="hour">${pad(hour)}</span>:<span data-field="minute">${pad(minute)}</span>`
      } else if (!isStar(minute) && isStar(hour)) {
        timePart = `At <span data-field="minute">minute ${minute}</span>`
      } else {
        timePart = "At every minute"
      }

      // Day of month with spans
      if (day === "L") {
        dayPart = ` on <span data-field="day">the last day</span> of the month`
      } else if (day.includes("/")) {
        dayPart = ` on every <span data-field="day">${day.split("/")[1]}th day</span> of the month`
      } else if ((day.includes("-") || day.includes(",")) && parseList(day, null, 31)) {
        dayPart = ` on <span data-field="day">days ${parseList(day, null, 31)}</span>`
      } else if (!isStar(day)) {
        dayPart = ` on <span data-field="day">day ${day}</span> of the month`
      }

      // Month with spans
      if ((month.includes("-") || month.includes(",")) && parseList(month, monthNames, 12)) {
        monthPart = ` in <span data-field="month">${parseList(month, monthNames, 12)}</span>`
      } else if (!isStar(month)) {
        monthPart = ` in <span data-field="month">${monthNames[Number.parseInt(month) - 1]}</span>`
      }

      // Weekday with spans
      if (weekday.includes("#")) {
        const [dayNum, occurrence] = weekday.split("#")
        weekdayPart = ` on <span data-field="weekday">the ${occurrence}th ${dayNames[Number.parseInt(dayNum)]}</span>`
      } else if (weekday === "L") {
        weekdayPart = ` on <span data-field="weekday">the last weekday</span>`
      } else if ((weekday.includes("-") || weekday.includes(",")) && parseList(weekday, dayNames, 6)) {
        weekdayPart = ` on <span data-field="weekday">${parseList(weekday, dayNames, 6)}</span>`
      } else if (!isStar(weekday)) {
        weekdayPart = ` on <span data-field="weekday">${dayNames[Number.parseInt(weekday)]}</span>`
      }

      return `${timePart}${dayPart}${monthPart}${weekdayPart}`
    } catch {
      return "At a custom schedule"
    }
  }

  matchesExpression(date, parts) {
    const [minute, hour, day, month, weekday] = parts

    return (
      this.matchesField(date.getMinutes(), minute, 0, 59) &&
      this.matchesField(date.getHours(), hour, 0, 23) &&
      this.matchesField(date.getDate(), day, 1, 31) &&
      this.matchesField(date.getMonth() + 1, month, 1, 12) &&
      this.matchesField(date.getDay(), weekday, 0, 6)
    )
  }

  matchesField(value, field, min, max) {
    if (field === "*") return true

    if (field.includes(",")) {
      const values = field.split(",").map(Number)
      return values.includes(value)
    }

    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number)
      return value >= start && value <= end
    }

    if (field.includes("/")) {
      const [range, step] = field.split("/")
      const stepValue = Number.parseInt(step)
      if (range === "*") {
        return value % stepValue === 0
      }
    }

    return Number.parseInt(field) === value
  }
}

// Application state
const cronParser = new CronParser()
const cronExecutionCalculator = new CronExecutionCalculator()
const cronInput = document.getElementById("cron-input")
const parsedOutput = document.getElementById("parsed-output")
const errorOutput = document.getElementById("error-output")
const fieldLabels = document.querySelectorAll(".field-label")

// Initialize templates
function initTemplates() {
  templatesGrid.innerHTML = cronTemplates
    .map(
      (template) => `
    <div class="template-item" data-expression="${template.expression}">
      <div class="template-title">${template.title}</div>
      <div class="template-expression">${template.expression}</div>
    </div>
  `,
    )
    .join("")

  // Add click handlers
  templatesGrid.querySelectorAll(".template-item").forEach((item) => {
    item.addEventListener("click", () => {
      cronInput.value = item.dataset.expression
      updateDisplay()
      cronInput.focus()
    })
  })
}

// Add tooltips to field labels
function addTooltips() {
  const tooltips = {
    minute: "Minutes (0-59)",
    hour: "Hours (0-23)",
    day: "Day of month (1-31)",
    month: "Month (1-12)",
    weekday: "Day of week (0-6, 0=Sunday)",
  }

  fieldLabels.forEach((label) => {
    const field = label.dataset.field
    label.setAttribute("data-tooltip", tooltips[field])
    label.classList.add("tooltip")
  })
}

// Copy functionality
function copyExpression() {
  const expression = cronInput.value.trim()
  navigator.clipboard.writeText(expression).then(() => {
    copyBtn.classList.add("copied")
    copyBtn.querySelector(".copy-text").textContent = "Copied!"
    setTimeout(() => {
      copyBtn.classList.remove("copied")
      copyBtn.querySelector(".copy-text").textContent = "Copy"
    }, 2000)
  })
}

// Timezone handling
function updateTimezone() {
  currentTimezone = timezoneSelector.value
  updateDisplay()
}

// Enhanced display update with proper sentence formatting
function updateDisplay() {
  const expression = cronInput.value.trim()
  const validation = cronParser.validate(expression)

  if (validation.valid) {
    cronInput.classList.remove("error")
    errorOutput.style.display = "none"

    const description = cronParser.describe(validation.parts)
    parsedOutput.innerHTML = `"${description}."`

    updateUpcomingExecutions(expression)
    document.getElementById("upcoming-executions").style.display = "block"
  } else {
    cronInput.classList.add("error")
    errorOutput.style.display = "block"
    errorOutput.textContent = `Error: ${validation.message}`
    parsedOutput.innerHTML = ''
    document.getElementById("upcoming-executions").style.display = "none"
  }
}

function updateUpcomingExecutions(expression) {
  try {
    const executions = cronExecutionCalculator.getNextExecutions(expression, 5, currentTimezone)

    const executionNext = document.getElementById("execution-next")
    const executionListSimple = document.getElementById("execution-list-simple")

    if (executions.length === 0) {
      executionNext.innerHTML = '<span class="execution-label">No upcoming executions</span>'
      executionListSimple.innerHTML = ""
      return
    }

    // Show the first execution with clickable "next" label
    executionNext.innerHTML = `
      <span class="execution-label" id="toggle-executions">next</span>
      <span class="execution-time">at ${executions[0]}</span>
    `

    // Populate the remaining executions
    const remaining = executions.slice(1)
    executionListSimple.innerHTML = remaining
      .map(
        (date) => `
        <div class="execution-item">
          <span class="execution-label">then</span>
          <span class="execution-time">at ${date}</span>
        </div>`,
      )
      .join("")

    // Add click handler for toggle
    const toggleButton = document.getElementById("toggle-executions")
    if (toggleButton) {
      toggleButton.addEventListener("click", toggleExecutionsList)
    }

    // Reset expanded state when updating
    executionsExpanded = false
    executionListSimple.classList.remove("expanded")
  } catch (error) {
    console.error("Error updating upcoming executions:", error)
    const executionNext = document.getElementById("execution-next")
    executionNext.innerHTML = '<span class="execution-label">Error calculating executions</span>'
  }
}

function toggleExecutionsList() {
  const executionListSimple = document.getElementById("execution-list-simple")
  executionsExpanded = !executionsExpanded

  if (executionsExpanded) {
    executionListSimple.classList.add("expanded")
  } else {
    executionListSimple.classList.remove("expanded")
  }
}

// Challenges functionality
function showChallenges() {
  challengesModal.style.display = "flex"
  loadChallenge(currentChallenge)
}

function loadChallenge(index) {
  const challenge = cronChallenges[index]
  const challengeContent = document.getElementById("challenge-content")

  challengeContent.innerHTML = `
    <div class="challenge">
      <div class="challenge-question">
        <h3>Challenge ${index + 1} of ${cronChallenges.length}</h3>
        <p>${challenge.question}</p>
      </div>
      <div class="challenge-input">
        <input type="text" id="challenge-answer" class="cron-input" placeholder="Enter your cron expression">
        <button id="check-answer" class="copy-btn">Check Answer</button>
      </div>
      <div id="challenge-feedback" class="challenge-feedback"></div>
      <div class="challenge-hint" style="display: none;">
        <strong>Hint:</strong> ${challenge.hint}
      </div>
      <div class="challenge-nav">
        <button id="show-hint" class="toggle-btn">Show Hint</button>
        <button id="next-challenge" class="challenges-btn" style="display: none;">Next Challenge</button>
      </div>
    </div>
  `

  // Add event listeners for challenge
  document.getElementById("check-answer").addEventListener("click", checkAnswer)
  document.getElementById("show-hint").addEventListener("click", showHint)
  document.getElementById("next-challenge")?.addEventListener("click", nextChallenge)
}

function checkAnswer() {
  const userAnswer = document.getElementById("challenge-answer").value.trim()
  const correctAnswer = cronChallenges[currentChallenge].answer
  const feedback = document.getElementById("challenge-feedback")

  if (userAnswer === correctAnswer) {
    feedback.innerHTML = '<div class="success">✅ Correct! Well done!</div>'
    document.getElementById("next-challenge").style.display = "inline-block"
  } else {
    feedback.innerHTML = '<div class="error">❌ Not quite right. Try again!</div>'
  }
}

function showHint() {
  document.querySelector(".challenge-hint").style.display = "block"
}

function nextChallenge() {
  currentChallenge = (currentChallenge + 1) % cronChallenges.length
  loadChallenge(currentChallenge)
}

// Track cursor position in cron input
function trackCursorPosition() {
  const input = cronInput
  const cursorPos = input.selectionStart
  const expression = input.value
  const parts = expression.split(" ")

  let currentPos = 0
  let fieldIndex = -1

  for (let i = 0; i < parts.length; i++) {
    if (cursorPos >= currentPos && cursorPos <= currentPos + parts[i].length) {
      fieldIndex = i
      break
    }
    currentPos += parts[i].length + 1 // +1 for space
  }

  const fieldNames = ["minute", "hour", "day", "month", "weekday"]

  // Highlight corresponding field label
  fieldLabels.forEach((label, index) => {
    label.classList.toggle("highlight", index === fieldIndex)
  })

  // Highlight corresponding spans in parsed output
  const outputSpans = parsedOutput.querySelectorAll("span[data-field]")
  outputSpans.forEach((span) => {
    const spanField = span.getAttribute("data-field")
    const isCurrentField = fieldIndex >= 0 && fieldNames[fieldIndex] === spanField
    span.classList.toggle("highlight", isCurrentField)
  })
}

// Field highlighting
function highlightField(fieldName) {
  fieldLabels.forEach((label) => {
    label.classList.toggle("highlight", label.dataset.field === fieldName)
  })
}

function clearHighlight() {
  fieldLabels.forEach((label) => label.classList.remove("highlight"))
}

// Event listeners
themeToggle.addEventListener("click", toggleTheme)
cronInput.addEventListener("input", updateDisplay)
copyBtn.addEventListener("click", copyExpression)
timezoneSelector.addEventListener("change", updateTimezone)
challengesToggle.addEventListener("click", showChallenges)
closeChallenges.addEventListener("click", () => {
  challengesModal.style.display = "none"
})

fieldLabels.forEach((label) => {
  label.addEventListener("mouseenter", () => highlightField(label.dataset.field))
  label.addEventListener("mouseleave", clearHighlight)
})

// Add event listeners for cursor tracking
cronInput.addEventListener("keyup", trackCursorPosition)
cronInput.addEventListener("click", trackCursorPosition)
cronInput.addEventListener("focus", trackCursorPosition)

// Enhanced initialization
document.addEventListener("DOMContentLoaded", () => {
  initTemplates()
  addTooltips()
  initTheme()
  updateDisplay()
})

// Auto-update execution times every minute
setInterval(() => {
  const validation = cronParser.validate(cronInput.value.trim())
  if (validation.valid) {
    updateUpcomingExecutions(cronInput.value.trim())
  }
}, 60000)
