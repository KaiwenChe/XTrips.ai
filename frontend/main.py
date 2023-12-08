import requests
import json

import uuid
import pathlib
import logging
import sys
import os
import base64

from hashlib import sha256
from configparser import ConfigParser


############################################################
#
# auth
#

sessions = {}


def load_sessions():
  """
  Loads the previous sessions from the sessions.json file
  """

  global sessions
  if os.path.exists("sessions.json"):
    with open("sessions.json", "r") as f:
      sessions = json.load(f)


def update_session(email, token):
  """
  Updates the session with the given email and token
  """

  global sessions
  sessions[email] = {"token": token, "active": False}

  use_session(email)


def get_active_session():
  """
  Returns the active session
  """

  global sessions
  for email in sessions:
    if sessions[email]["active"]:
      return email, sessions[email]["token"]
  return None, None


def use_session(email):
  """
  Sets the session with the given email to active
  """

  global sessions
  for session in sessions:
    sessions[session]["active"] = False
  sessions[email]["active"] = True
  with open("sessions.json", "w") as f:
    json.dump(sessions, f, indent=2)


def clear_sessions():
  """
  Clears all sessions
  """

  global sessions
  sessions = {}
  with open("sessions.json", "w") as f:
    json.dump(sessions, f, indent=2)


def handle_error(url, res):
  """
  Handles an error from a request
  """

  print("Failed with status code:", res.status_code)
  print("  url:", url)
  print("  message:", res.json()["message"])

def display_page(data, page, page_size):
    start = (page - 1) * page_size
    end = start + page_size
    for leg in data[start:end]:
        print(f"Leg UID: {leg['leg_uid']}")
        print(f"Session String: {leg['session_string']}")
        print(f"Departure: {leg['depart_date_time']}")
        print(f"Arrival: {leg['arrival_date_time']}")
        print(f"Overnight: {'Yes' if leg['overnight'] else 'No'}")
        print(f"Price: ${leg['price']} USD")
        print(f"Stopover Duration: {leg['stopover_duration']}")
        print(f"Number of Stopovers: {leg['stopovers_count']}")
        print(f"Long Stopover: {'Yes' if leg['long_stopover'] else 'No'}")
        print("-" * 40)  # This adds a separator line between each leg
############################################################
#
# prompt
#
def prompt():
  """
  Prompts the user and returns the command number

  Parameters
  ----------
  None

  Returns
  -------
  Command number entered by user (0, 1, 2, ...)
  """
  print()
  print(">> Enter a command:")
  print("   1 => register")
  print("   2 => login")
  print("   3 => query")
  print("   6 => generate travel tips for your trip")
  print("   7 => view your travel tips")


  cmd = input()

  if cmd == "":
    cmd = -1
  elif not cmd.isnumeric():
    cmd = -1
  else:
    cmd = int(cmd)

  return cmd


############################################################
#
# register
#
def register(baseurl):
  """
  Register user in the database

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/register'
    url = baseurl + api
    print('===============================================')
    print('Register User')
    print('Please input email address for the user:')
    email = str(input())
    print('Please input last name for the user:')
    last_name = str(input())
    print('Please input first name for the user:')
    first_name = str(input())
    print('Please input password for the user:')
    password = str(input())
    password_hash = sha256(password.encode('utf-8')).hexdigest()
    data = {"last_name": last_name, "first_name": first_name, "email": email, "password_hash": password_hash}
    res = requests.post(url, json=data)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:
        # we'll have an error message
        body = res.json()
        print("Error message:", body)
      #
      return

    body = res.json()
    print(body['message'])


  except Exception as e:
    logging.error("register() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return
  
############################################################
#
# login
#
def login(baseurl):
  """
  login user 

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/login'
    url = baseurl + api
    print('===============================================')
    print('Login User')
    print('Please input email address for the user:')
    email = str(input())
    print('Please input password for the user:')
    password = str(input())

    password_hash = sha256(password.encode('utf-8')).hexdigest()
    data = {"email": email, "password_hash": password_hash}
    res = requests.post(url, json=data)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:
        # we'll have an error message
        body = res.json()
        print("Error message:", body)
      #
      return

    body = res.json()
    token = body["data"]["token"]
    # print(body['message'])
    print(body["message"])
    update_session(email, token)
    return

  except Exception as e:
    logging.error("register() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return
############################################################
# query flight  
def query(baseurl): 
    username, token = get_active_session()

    if username is None:
        print("No active session...")
        return

    try:
      print('Please enter your origin airport code: (e.g: ORD) ')
      origin = input()
      print('Please enter your destination airport code: (e.g: MDW) ')
      dest = input()
      print('Please enter your departDate: (form: YYYY-MM-DD) ')
      departDate = input()

      data = {"origin": origin, "dest": dest, "departDate":departDate}
      
      api = '/query'
      url = baseurl+api

      res = requests.post(url, json=data, headers={"Authorization": token})

      if not res.ok:
        handle_error(url, res)
        return
      
      body = res.json()

      page_size = 5  
      current_page = 1
      total_pages = (len(body) + page_size - 1) // page_size
      
      while True:
          print(f"Page {current_page}/{total_pages}")
          display_page(body, current_page, page_size)

          if current_page < total_pages:
              print("Enter 'n' to go to the next page or any other key to exit.")
              if input().lower() != 'n':
                  break
              current_page += 1
          else:
              print("You have reached the last page.")
              break




        
    except Exception as e:
      logging.error("query() failed:")
      logging.error(e)
      return
    
############################################################

def book(baseurl, data):
    
    try:
        print('Please input payment information to book your flight.')
        while True:
            credit_name = input('Credit cardholder name:')
            print('Supported card type: Visa, Mastercard')
            card_number = input('Credit card number:')
            cvv = input('credit card cvv code (3 digits): ')
            if len(credit_name) == 0:
                print('No name is provided. Please input payment again.')
            elif not card_number.isdigit() or len(card_number) != 16 or card_number[0] not in ['2', '4', '5']:
                print('invalid card number. Please input payment again.')
            elif len(cvv) != 3 or not cvv.isdigit():
                print('Transaction failed. Please input payment again.')
            else:
                break
        api = '/book'
        url = baseurl + api
        res = requests.post(url, json=data)
        if res.status_code != 200:
            print('something wrong happened...')
            return
        else:
            print('Your booking is made successfully!')
    except Exception as e:
        logging.error("book() failed:")
        logging.error(e)
        return

def split_flight_no(uid):
    lst = []
    for i in uid:
        if '~' in uid:
            l = i.split('~')[0]
            lst.append(l)
    return '-'.join(lst)


def display(baseurl, userid):
    username, token = get_active_session()

    if username is None:
        print("No active session...")
        return
    try:
        api = '/display'
        url = baseurl + api
        res = requests.get(url, json=userid, headers={"Authorization": token})
        if res.status_code != 200:
            print('something wrong happened...')
            return
        body = res.json()
        data = body['data']
        if len(data) == 0:
            print('No reservation found.')
            return
        print('Reservation:')
        for i in data:
            print()
            fligtnumber = i['flightnumber'].split(':')
            fn = split_flight_no(flightnumber)
            origin = i['origin']
            dest = i['dest']
            session_str = i['session_string']
            depart_date = i['depart_date']
            arrival_date = i['arrival_date']
            stopover_duration = i['stopover_duration']
            fares = i['fares']
            print(fn, session_str)
            print(origin, 'to', dest)
            print('Departing time:', depart_date)
            print('Arrival time:', arrival_date)
            if stopover_duration is not None:
                print('stopover duration time:', stopover_duration)
            print(fares)
            print()
            print('===============================================')
    except Exception as e:
        logging.error("display() failed:")
        logging.error(e)
        return
    

############################################################
#
# generate
#
def generate(baseurl):
  """
  Generate ai recommendation based on the booking information of the user

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """
  
  try:
    username, token = get_active_session()

    if username is None:
        print("No active session...")
        return
    api = "/generate"

    print("Enter your confirmation number: ")
    confirmation_number = input()

    url = baseurl + api
    
    data = {"confirmation_number": confirmation_number}
    print("Generating AI recommendation, this may take a while...")
    response = requests.post(url, json=data , headers={"Authorization": token})

    if response.status_code != 200:
      # failed:
      print("Failed with status code:", response.status_code)
      print("url: " + url)
      if response.status_code == 400 or response.status_code == 500:
        body = response.json()
        print("Error message:", body["message"])
        return
      
    body = response.json()
    print(body['message'])
    print("Your file id for retrieval: ", body['file_id'])

  except Exception as e:
    logging.error("generate() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return
  

############################################################
#
# view recommendation
#
def view_rec(baseurl):
  """
  download and display ai recommendation specified by the user

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """
  try:
    username, token = get_active_session()

    if username is None:
        print("No active session...")
        return
    api = "/view_rec"

    print("Enter your file id: ")
    file_id = input()

    url = baseurl + api + "/" + file_id
    
    response = requests.get(url, headers={"Authorization": token})

    if response.status_code != 200:
      # failed:
      print("Failed with status code:", response.status_code)
      print("url: " + url)
      if response.status_code == 400:
        body = response.json()
        print("Error message:", body["message"])
        return
      
    body = response.json()
    datastr = body['data']

    base64_bytes = datastr.encode()
    bytes = base64.b64decode(base64_bytes)
    results = bytes.decode()

    # Pagination
    page_size = 500
    pages = [results[i:i + page_size] for i in range(0, len(results), page_size)]

    print("**Travel Planner V1.0**")
    for i, page in enumerate(pages):
        print(f"\nPage {i + 1}/{len(pages)}")
        print(page)
        
        if i < len(pages) - 1:
            print("\nView the next page? (y/n)")
            user_input = input().strip().lower()
            if user_input  != 'y' and user_input  != 'Y':
                break

    print("End of results.")
    return

  except Exception as e:
    logging.error("generate() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


############################################################
# main
#
try:
  print('** Welcome to Xtrips.ai **')
  print()

  # eliminate traceback so we just get error message:
  sys.tracebacklimit = 0

  #
  # what config file should we use for this session?
  #
  config_file = 'client-config.ini'


  #
  # setup base URL to web service:
  #
  configur = ConfigParser()
  configur.read(config_file)
  baseurl = configur.get('client', 'webservice')

  #
  # make sure baseurl does not end with /, if so remove:
  #
  if len(baseurl) < 16:
    print("**ERROR: baseurl '", baseurl, "' is not nearly long enough...")
    sys.exit(0)

  if baseurl == "https://YOUR_GATEWAY_API.amazonaws.com":
    print("**ERROR: update config.ini file with your gateway endpoint")
    sys.exit(0)

  lastchar = baseurl[len(baseurl) - 1]
  if lastchar == "/":
    baseurl = baseurl[:-1]

  #
  # main processing loop:
  #
  load_sessions()
  cmd = prompt()

  while cmd != 0:
    #
    if cmd == 1:
      register(baseurl)
    elif cmd == 2:
      login(baseurl)
    elif cmd == 3:
      query(baseurl)  
    elif cmd == 6:
      generate(baseurl)
    elif cmd == 7:
      view_rec(baseurl)
    
    else:
      print("** Unknown command, try again...")
    #
    cmd = prompt()

  #
  # done
  #
  print()
  print('** done **')
  sys.exit(0)

except Exception as e:
  logging.error("**ERROR: main() failed:")
  logging.error(e)
  sys.exit(0)
