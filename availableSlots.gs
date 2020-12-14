var WEEKS_IN_ADVANCE = 1;

// The maximum script run time under Apps Script Pro is 30 minutes; this setting
// will be used to report when the script is about to reach that limit.
var MAX_PRO_RUNTIME_MS = 29 * 60 * 1000;

/**
 * Look through the given users public calendars and return all events.
 */
function syncTeamAvailableSlotsCalender() {
  var today = new Date();
  var futureDate = new Date();
  futureDate.setWeek(futureDate.getWeeks() + WEEKS_IN_ADVANCE);
  var lastRun = PropertiesService.getScriptProperties().getProperty('lastRun');
  lastRun = lastRun ? new Date(lastRun) : null;

  // Get the list of users in the domain.
  var users = getDomainUsers();

  // For each user, find events having the event summary in the specified date range
  // calendar.
  var count = 0;
  var timeout = false;
  for (var i = 0; i < users.length; i++) {
    if (isTimeUp(today, new Date())) {
      timeout = true;
      break;
    }
    var user = users[i];
    var username = user.split('@')[0];
    
    var events = findEvents(user, keyword, today, futureDate, lastRun);
    Logger.log('fetched events for ' + user);

  }
  PropertiesService.getScriptProperties().setProperty('lastRun', today);
  if (timeout) {
    Logger.log('Execution time about to hit quota limit; execution stopped.');
  }
  var executionTime = ((new Date()).getTime() - today.getTime()) / 1000.0;
  Logger.log('Total execution time (s) : ' + executionTime); ;
}

/**
 * In a given user's calendar, look for events within the specified date range and return any such events
 * found.
 * @param {string} user the user's primary email String.
 * @param {Date} start the starting Date of the range to examine.
 * @param {Date} end the ending Date of the range to examine.
 * @param {Date} opt_since a Date indicating the last time this script was run.
 * @return {object[]} an array of calendar event Objects.
 */
function findEvents(user, start, end, opt_since) {
  var params = {
    timeMin: formatDate(start),
    timeMax: formatDate(end),
    showDeleted: false
  };
  if (opt_since) {
    // This prevents the script from examining events that have not been
    // modified since the specified date (that is, the last time the
    // script was run).
    params['updatedMin'] = formatDate(opt_since);
  }
  var results = [];
  try {
    var response = Calendar.Events.list(user, params);
    results = response.items.filter(function(item) {
      // If the event was created by someone other than the user, only include
      // it if the user has marked it as 'accepted'.
      if (item.organizer && item.organizer.email != user) {
        if (!item.attendees) {
          return false;
        }
        var matching = item.attendees.filter(function(attendee) {
          return attendee.self;
        });
        return matching.length > 0 && matching[0].status == 'accepted';
      }
      return true;
    });
  } catch (e) {
    Logger.log('Error retriving events for %s: %s; skipping',
        user, e.toString());
    results = [];
  }
  return results;
}

/**
 * Return a list of the primary emails of users in this domain.
 * @return {string[]} An array of user email strings.
 */
function getDomainUsers() {
  var pageToken;
  var page;
  var userEmails = [];
  // get userEmails from input
  return userEmails;
}

/**
 * Return an RFC3339 formated date String corresponding to the given
 * Date object.
 * @param {Date} date a Date.
 * @return {string} a formatted date string.
 */
function formatDate(date) {
  return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd\'T\'HH:mm:ssZ');
}

/**
 * Compares two Date objects and returns true if the difference
 * between them is more than the maximum specified run time.
 *
 * @param {Date} start the first Date object.
 * @param {Date} now the (later) Date object.
 * @return {boolean} true if the time difference is greater than
 *     MAX_PROP_RUNTIME_MS (in milliseconds).
 */
function isTimeUp(start, now) {
  return now.getTime() - start.getTime() > MAX_PRO_RUNTIME_MS;
}
// [END apps_script_calendar_available_slots]
