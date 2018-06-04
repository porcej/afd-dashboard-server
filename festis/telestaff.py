#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Festis.telestaff: downlaods data from telestaff


Changelog:
	-2017-06-23 - Updated getRosterNameField to correctly 
					parse notes from titles
   - 2017-10-07 - Update getMemberInfo to look for data-popup-status to have a value of "Request Pending" instead of the existance of a "request field"
   - 2017-12-04 - Updated parseCalendar to handle pending requests (isRequest)
   - 2018-02-08 - Updated doLogin to handle Contact Log Requests
   - 2018-02-08 - Updated parseWebstaffroster to check for roster lenght (make sure it is there before attempting to parse it)
	 - 2018-03-12 - Updated getMemberInfo to handle formating workcodes from SVGs

"""

__author__ = 'Joe Porcelli (porcej@gmail.com)'
__copyright__ = 'Copyright (c) 2017 Joe Porcelli'
__license__ = 'New-style BSD'
__vcs_id__ = '$Id$'
__version__ = '0.0.3' #Versioning: http://www.python.org/dev/peps/pep-0386/


import urllib, base64, requests
import requests_ntlm
from bs4 import BeautifulSoup
from datetime import datetime
import re
import yaml

# Import JSON... Try Simple if its available and default to stdlib
try: import simplejson as json
except ImportError: import json

# We will attempt to us lxml parser... but we will fail back to html.parser just incase
parser = 'html.parser'
try:
	from lxml import html
	parser = 'lxml'
except ImportError: 
	parser = 'html.parser'

def urlScheme():
	return 'https://'


def urlHost():
	return 'telestaff.alexandriava.gov'

def makeURL(path=''):
	if path == '':
		return urlScheme() + urlHost()

	if not path.startswith('/'):
		path = '/' + path
	return urlScheme() + urlHost() + path


def authDomain():
	return 'alexgov.net\\'


# Sets a standard for user agents
def userAgent(agent=''):
	if (agent == ''):
		agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'

	return {'User-Agent': agent}


def currentDate():
	return datetime.now().strftime('%Y%m%d')

def cleanString(str):
	return str.strip().replace('\n', '').replace('\r', '').replace('\t', '')

def getcleanString(soup, cls, elm='div'):
	"""Returns a clean text string for text componet of the elm with class cls"""
	try:
		return cleanString(soup.find(elm, attrs={'class': cls}).text)
	except:
		return False


def getRosterDate(src):
	"""Returns the text string for current roster date from Workforce Telstaff 5.4.5.2"""
	return src.findAll("div", { "class" : "dateName" })[0].span.text


def getRosterNameField(soup):
	"""Returns name and notes for Workforce Telestaff's Name Div"""
	nameClasses = ['dateName', 'organizationName', 'battalionName', 'shiftName', 'unitName', 'positionName']
	nameAndNotes = {"title": '', "notes":'', "dot": False, "extra": False}
	
	tmp = soup.find("div", {"class": nameClasses})


	if tmp and tmp.span.text:
		# m = re.search('^((\+)?(\.)?([^{]*).?([^}]*))?', tmp.span.text)
		nameAndNotes["title"] = tmp.span.text
		m = re.search('^((\+)?(\.)?([^{]*).?([^}]*))?', tmp.span.text)
		if m.lastindex and m.lastindex > 1:
			if m.group(4):
				nameAndNotes["title"] = m.group(4).strip()
			if m.group(5):
				nameAndNotes["notes"] = m.group(5).strip()
			if m.group(3):
				nameAndNotes["dot"] = True
			if m.group(2):
				nameAndNotes["extra"] = True
		else:
			m = re.search('^([^{]*){?([^}]*)}?', tmp.span.text)
			if m.group(1):
				nameAndNotes["title"] = m.group(1).strip()
			if m.group(2):
				nameAndNotes["notes"] = m.group(2).strip()

	return nameAndNotes

#  ****************************************************************************
#  Replaced on 2017/10/07 to accept telestaffs new pending status convention
# def getMemberInfo(soup):
# 	data = {"name": "", "specialties": "", "badge": "", "workcode": "", "exceptioncode": "", "isRequest": False, "startTime": "", "endTime": "", "duration": 24}

# 	# Get Personal Info
# 	resourceDisplay = soup.find("div", attrs={"data-field": "resourcedisplay"})
# 	if resourceDisplay.has_attr('data-popup-title'):
# 		data["name"] = resourceDisplay['data-popup-title']

# 	if resourceDisplay.has_attr('data-popup-specialties'):
# 		data["specialties"] = resourceDisplay['data-popup-specialties']

# 	fid = soup.find("div", attrs={"data-field": "idcolumn"})
# 	if fid.has_attr("data-id"):
# 		data['badge'] = fid['data-id']

# 	# Get Work Code Info
# 	codes = soup.find("div", attrs={"data-field": "workcode"})
# 	if codes.has_attr('data-popup-title'):
# 		data['workcode'] = codes['data-popup-title']
# 		if codes.has_attr('style'):
# 			data['workcode_style'] = codes['style']
# 		if codes.has_attr('data-popup-request'):
# 			data['isRequest'] = codes['data-popup-request']
# 		exceptCode = codes.find("span",  { "class" : "exceptionCode" })
# 		data["exceptioncode"] = exceptCode.text;

# 	# Get work time info
# 	times = soup.find("div", attrs={"class": "shiftTimes", "data-popup-title": "From"})
# 	if times.has_attr('data-popup-value'):
# 		data['startTime'] = times['data-popup-value']

# 	times = soup.find("div", attrs={"class": "shiftTimes", "data-popup-title": "Through"})
# 	if times.has_attr('data-popup-value'):
# 		data['endTime'] = times['data-popup-value']

# 	times = soup.find("div", attrs={"class": "shiftDuration"})
# 	if times.has_attr('data-popup-value'):
# 		data['duration'] = times['data-popup-value']

# 	return data

#  ****************************************************************************
#  Replaced on 2017/10/07 to accept telestaffs new pending status convention
#  Updated on 2018/03/12 to handle workcode formating using SVG
def getMemberInfo(soup):
	data = {"name": "", "specialties": "", "badge": "", "workcode": "", "exceptioncode": "", "isRequest": False, "startTime": "", "endTime": "", "duration": 24}

	# Get Personal Info
	resourceDisplay = soup.find("div", attrs={"data-field": "resourcedisplay"})
	if resourceDisplay.has_attr('data-popup-title'):
		data["name"] = resourceDisplay['data-popup-title']

	if resourceDisplay.has_attr('data-popup-specialties'):
		data["specialties"] = resourceDisplay['data-popup-specialties']

	fid = soup.find("div", attrs={"data-field": "idcolumn"})
	if fid.has_attr("data-id"):
		data['badge'] = fid['data-id']

	# Get Work Code Info
	codes = soup.find("div", attrs={"data-field": "workcode"})
	if codes.has_attr('data-popup-title'):
		data['workcode'] = codes['data-popup-title']
		
		# Added on 2018/03/12 to handle formating iconogrpahy
		styleSpan = codes.find('span', attrs={'class': 'exceptionCode'})
		if styleSpan.has_attr('style'):
			data['workcode_style'] = styleSpan['style']
			
		rect = codes.find('svg', attrs={'class': 'rosterSvg'}).rect
		if rect.has_attr('style'):
			data['workcode_style'] += "background-color: " + rect['style'].replace('fill:','')
		
		# 		if codes.has_attr('style'):
		# 			data['workcode_style'] = codes['style']

		# Added on 2017-`0-07 to deal with new status field and the removal of the request field
		if codes.has_attr('data-popup-statusenum'):
			data['isRequest'] =  codes['data-popup-statusenum'] == "APPROVAL_PENDING"


		# Still support the old telestaff request field
		if codes.has_attr('data-popup-request'):		
			data['isRequest'] = codes['data-popup-request']
		exceptCode = codes.find("span",  { "class" : "exceptionCode" })
		data["exceptioncode"] = exceptCode.text;

	# Get work time info
	times = soup.find("div", attrs={"class": "shiftTimes", "data-popup-title": "From"})
	if times.has_attr('data-popup-value'):
		data['startTime'] = times['data-popup-value']

	times = soup.find("div", attrs={"class": "shiftTimes", "data-popup-title": "Through"})
	if times.has_attr('data-popup-value'):
		data['endTime'] = times['data-popup-value']

	times = soup.find("div", attrs={"class": "shiftDuration"})
	if times.has_attr('data-popup-value'):
		data['duration'] = times['data-popup-value']

	return data


def parseRoster(soup, parent="root"):
	"""Recursivly parses a Workforce Telestaff Roster"""
	# Dict object to hold data
	data = {}
	idClasses = ['idDate', 'idInstitution', 'idAgency', 'idBatallion', 'idShift', 'idStation', 'idUnit', 'idPosition']

	# Find the first data class
	first_li = soup.find("li", {"class": idClasses})

	# Now that we have the first class, find all of that class's siblings (same level)
	# lis = [dateLi] + dateLi.find_all("li", {"class": idClasses})
	lis = [first_li] + first_li.find_next_siblings('li', {'class': idClasses})

	# return getRosterNameField(first_li)['title']

	# Loop over the first class and all of it's siblings, we will look for people,
	#	or, optionally, look deeper in the tree for people
	for li in lis:

		groupType = li['class'][0][2:]
		groupData = {}
		groupData.update(getRosterNameField(li))

		# Check if this is a person, if so look for more data
		if "Position" == li['class'][0][2:]:
			groupData.update(getMemberInfo(li))
		else:
			# Nope, not a person... lets see if there are any people hanging around here
			if li.find("li", {"class": idClasses}):
				groupData.update(parseRoster(li, li['class'][0][2:]))
		
		data.setdefault(groupType, []).append(groupData)

	return data



def parseWebStaffRoster(raw):
	""""Takes a raw HTML page, finds Telestaff Roster and Parses it"""

	# Create Soup Tree from HTML
	soup = BeautifulSoup(raw.encode('utf-8'), parser)

	# Find roster in soup tree and through away everything else
	soup = soup.findAll("ol", {"class": "rosterTableList"})

	#
	if (len(soup) > 0):
		soup = soup[0]
	else:
		return {'error': 'No roster found'}

	# And now we parse the roster...
	roster = parseRoster(soup)
	roster['type'] = 'roster'
	return roster



# 12/4/2017 - Added pending field to event dictionary to repsent pending events
def parseCalendar(soup):
	""""Takes a raw HTML page, finds Telestaff Calendar and parses it"""
	daysData = []

	# Next we find days and loop over them
	days = soup.findAll("div", {'class': "calendarDay"})
	for day in days:
		# Get the date for the day
		dateText = day.find('div', attrs={'class': 'dateDiv'}).text.strip()

		# Find all the events for that day and loop over them
		eventssoup = day.find_all('div', attrs={'class': 'listItem'})

		events = []
		for eventsoup in eventssoup:
			# Initilize a dict to hold events, if we don't have a type for it, we assume it an unknown
			event = {'type': 'unknown', 'isRequest': False}

			# Get Event Name
			name = getcleanString(eventsoup, 'listItemName')
			if name:
				event['name'] = name

			# Get Event pending status (added 12/4/2017)
			if eventsoup.find('span', attrs={'class': 'glyphicon-asterisk'}):
				event['isRequest'] = True

			# Get Event Location
			loc = getcleanString(eventsoup, 'listItemWhere')
			if loc:
				event['location'] = loc

			# Get Event Type
			if eventsoup.has_attr('data-attrtype'):
				event['type'] = eventsoup['data-attrtype']

			# Get Event time as a range
			time = getcleanString(eventsoup, 'listItemStartTime')
			if time:
				event['time'] = time

			# Get Event length (typically in hours)
			length = getcleanString(eventsoup, 'listItemHours')
			if length:
				event['length'] = length

			code = getcleanString(eventsoup, "exception")
			if code:
				event['exception-code'] = code

			# exceptionCode = getcleanString(eventsoup, 'exception')
			# if exceptionCodeexception-code:
			# 	event['exception-code'] = exceptionCode

			# # Get Event icon styling
			box = eventsoup.find('div', attrs={'class': 'listItemBox'})
			box = box.div

			if box.has_attr('style'):
				event['icon_style'] = cleanString(box['style'])

			events.append(event)


		# Append the day's date and events as a dict to the days list
		daysData.append({ 'date': datetime.strptime(dateText, '%A, %B %d, %Y').strftime('%Y%m%d'),
						  'events': events
						})
	return daysData

def parseFullCalendar(raw):
	""""Takes a raw HTML page, finds Telestaff Calendar and parses it"""
	data = {'type': 'calendar'}

	# Create Soup Tree from HTML
	soup = BeautifulSoup(raw.encode('utf-8'), parser)

	header = getcleanString(soup, cls='listHeader')
	if header:
		m = re.search('\(([^)]*)\)?\s?([\S]*)[\D]*([^a-zA-Z]*)', header)
		if m.group(1):
			data['owner'] = m.group(1).strip()
		if m.group(2):
			data["start"] = m.group(2).strip()
		if m.group(3):
			data['end'] = m.group(3).strip()
	soup.find({'class': ["centerContainer", "fullWidth", "topMargin"]})
	soup = soup.find('div', attrs={'class': ['fullWidth', 'topMarginSmall']})
	data['days'] = parseCalendar(soup)
	return data

def parseCalendarDashboard(raw):
	data = {'type': 'dashboard'}

	# Create Soup Tree from HTML
	soup = BeautifulSoup(raw.encode('utf-8'), parser)

	# Pull out the daterange for the calendar
	data['daterange'] = soup.find("span", {"class": "dateRange"}).text.strip()
	data['days'] = parseCalendar(soup)

	return data

# Logsin and returns session object... if login fails returns false
def doLogin(uname, pword, dname='', dpass=''):

	payload = {'username': uname, 'password': pword}

	login = {
		'session': requests.Session(),
		'status_code': '403',
		'CSRFToken': ''
	}

	login['session'].headers.update(userAgent())

	# Removed on 3/5/2018 to accomidate in network connections
	# login['session'] = requests.Session()
	# login['session'].auth = requests_ntlm.HttpNtlmAuth(authDomain() + dname, dpass, login['session'])
	
	# Get CSRFToken from login page
	# Added 3/1/2018
	loginPage = login['session'].get(makeURL('/login'));

	# Added 3/5/2018 
	# This fails to NTLM Auth if an unathorized error is received
	if loginPage.status_code == 401:
		login['session'].auth = requests_ntlm.HttpNtlmAuth(authDomain() + dname, dpass, login['session'])
		loginPage = login['session'].get(makeURL('/login'));

	
	soup = BeautifulSoup(loginPage.text.encode('utf-8'), parser)

	# Find the token in soup tree and through away everything else
	login['CSRFToken'] = soup.find("input", {"name": "CSRFToken"}).get('value');
	
	payload['CSRFToken'] = login['CSRFToken']

	
	

	# Login in to Workforce Telestaff
	# 2018-02/28 - Changled login location from processWebLogin to login
	loginResponse = login['session'].post(makeURL('/processWebLogin'), data=payload)
	#   loginResponse = login['session'].post(makeURL('/login'), data=payload)
	
	# Added 2/8/2018 to handle Check Contact Log Messages
	# We simply check if we are on the checkContactLog page
	#	If we have a checkContactLog page then we must:
	#		Firstly) View Contact Log (/contactLog?myContactLog=true)
	#		Secondly) Disposition Unresponded logs (/contactLog?dispositionedUnrespondedLogs=true)
	# If we are we request to disposition the contact log for this session 
	if (loginResponse.url.endswith('/checkContactLog')):
		contactResponse = login['session'].get(makeURL('/contactLog?myContactLog=true'))
		loginResponse = login['session'].get(makeURL('/contactLog?dispositionedUnrespondedLogs=true'))
	
	login['status_code'] = loginResponse.status_code

	return login


def getTelestaffData(uname, pword, dname, dpass, path, handler):

	login = doLogin(uname, pword, dname, dpass)

	# Check to see if login suceceed:
	if (login['status_code'] == requests.codes.ok):
		s = login['session']
		response = s.get(makeURL(path))
		if (response.status_code == requests.codes.ok):
			if (not response.url.endswith('login')):
				return {'status_code': response.status_code, 'data': handler(response.text)}
			else:
				return {'status_code': '403', 'data': 'Telestaff username and password combination not.'}
		else:
			return {'status_code': response.status_code}
	else:
		return {'status_code': str(login['status_code']), 'data': str(login) }
	return {'status_code': '403', 'data': 'Authentication or authorization issue. Code--: ' + str(login['status_code']) + '.' }


def getTelestaffCalendar(username, password, duser, dpass, date=None, jsonExport=False):
	if date is None:
		date = currentDate()
	action = '/calendar/' + date + '/list/'
	if jsonExport:
		return json.dumps(getTelestaffData(username, password, duser, dpass, action, parseFullCalendar))
	return getTelestaffData(username, password, duser, dpass, action, parseFullCalendar)


def getTelestaffRoster(username, password, duser, dpass, date=None, jsonExport=False):
	if date is None:
		date = currentDate()
	action = '/roster/d[' + date + ']/'
	if jsonExport:
		return json.dumps(getTelestaffData(username, password, duser, dpass, action, parseWebStaffRoster))
	return getTelestaffData(username, password, duser, dpass, action, parseWebStaffRoster)


def getTelestaffDashboard(username, password, duser, dpass, jsonExport=False):
	action = '/calendar/dashboard/'
	if jsonExport: 
		return json.dumps(getTelestaffData(username, password, duser, dpass, action, parseCalendarDashboard))
	return getTelestaffData(username, password, duser, dpass, action, parseCalendarDashboard)


def getTelestaff(username, password, duser, dpass, date=None, jsonExport=True, kind='dashboard'):
	if kind:
		if kind == 'roster':
			return getTelestaffRoster(username, password, duser, dpass, date, jsonExport)
		elif kind == 'calendar':
			return getTelestaffCalendar(username, password, duser, dpass, date, jsonExport)
		elif kind == 'picklist':
			return getTelestaffPicklist(username, password, duser, dpass, date)
	return getTelestaffDashboard(username, password, duser, dpass, jsonExport)


def getTelestaffPicklist(username, password, duser, dpass, date=''):
	

	# Authenticate against the system and establish a session
	login = doLogin(username, password, duser, dpass)
	if (login['status_code'] == requests.codes.ok):

		if not date:
			date = currentDate()

		rURL = makeURL('/schedule/pickList/fromCalendar/' + date + '/675?returnUrl=%2Fcalendar%2F'+ date + '%2F675')
		s = login['session']
		s.headers.update({
				'Host': urlHost(),
				'Referer': rURL,
				'Accept': 'application/json, text/javascript, */*; q=0.01',
				'X-Requested-With': 'XMLHttpRequest'
			})

		response = s.get(rURL)

		response = s.get(makeURL('/schedule/pickList/tableAjaxData'))

		
		if (response.status_code == requests.codes.ok):
			if (not response.url.endswith('login')):
				# rjson = handler(response.text)
				data = response.json();
				data['type'] = 'picklist';
				return json.dumps({'status_code': '200', 'data': data})
			else:
				return {'status_code': '403', 'data': 'Username or password not found.'}
		else:
			return {'status_code': response.status_code}
	return {'status_code': '403', 'data': 'Authentication or authorization issue. Code: ' + str(login['status_code']) + '.' }


def checkAuth(duser, dpass, url='', jsonExport=True):
	if url == '':
		url = makeURL()
	s = requests.Session()
	s.auth = requests_ntlm.HttpNtlmAuth(authDomain() + duser, dpass, s)
	s.headers.update(userAgent())
	login = s.get(url)

	resp = {'status_code': login.status_code }




	return json.dumps(resp)


def main():
	return False

